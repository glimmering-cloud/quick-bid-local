import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const email = "admin@quickbid.local";
    const password = "Admin@2026!";
    const displayName = "Platform Admin";

    // Check if already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existing) {
      userId = existing.id;
      // Update password in case it changed
      await supabase.auth.admin.updateUserById(userId, { password });
    } else {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName, role: "customer" },
      });
      if (authError) throw authError;
      userId = authData.user.id;
    }

    // Ensure profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from("profiles").insert({
        user_id: userId,
        display_name: displayName,
        role: "customer",
      });
    }

    // Ensure admin role exists
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!existingRole) {
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: "admin",
      });
    }

    return new Response(JSON.stringify({
      message: "Admin account ready",
      email,
      password,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Seed admin error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
