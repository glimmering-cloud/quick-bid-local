import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/types";

interface ProviderInfo {
  businessName: string;
  serviceCategory: string;
  providerType: string;
  location: { name: string; lat: number; lng: number; city: string };
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: "customer" | "provider", providerInfo?: ProviderInfo) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string, role: "customer" | "provider", providerInfo?: ProviderInfo) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;

    // The trigger should create the profile, but as a safety net wait and check
    if (data?.user) {
      // Small delay for trigger to fire
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if profile was created by trigger
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      // If trigger didn't create profile, create it manually
      if (!existingProfile) {
        await supabase.from("profiles").insert({
          user_id: data.user.id,
          display_name: displayName,
          role,
          location_lat: providerInfo?.location.lat ?? null,
          location_lng: providerInfo?.location.lng ?? null,
          location_name: providerInfo?.location.name ?? null,
        });
      } else if (providerInfo) {
        // Update profile with location if provider
        await supabase.from("profiles").update({
          location_lat: providerInfo.location.lat,
          location_lng: providerInfo.location.lng,
          location_name: providerInfo.location.name,
        }).eq("user_id", data.user.id);
      }

      // Create provider record if provider role
      if (role === "provider" && providerInfo) {
        await supabase.from("providers").insert({
          user_id: data.user.id,
          business_name: providerInfo.businessName || displayName,
          service_category: providerInfo.serviceCategory,
          provider_type: providerInfo.providerType,
          latitude: providerInfo.location.lat,
          longitude: providerInfo.location.lng,
          base_price_chf: 0,
          rating: 0,
        });
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);
    if (error) throw error;
    await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
