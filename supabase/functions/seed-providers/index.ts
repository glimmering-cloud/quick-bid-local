import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Swiss city centers for 35km coverage grid
const CITY_CENTERS = [
  { city: "Zurich", lat: 47.3769, lng: 8.5417 },
  { city: "Bern", lat: 46.9480, lng: 7.4474 },
  { city: "Lausanne", lat: 46.5167, lng: 6.6294 },
  { city: "Geneva", lat: 46.2100, lng: 6.1426 },
  { city: "Basel", lat: 47.5476, lng: 7.5896 },
  { city: "Lucerne", lat: 47.0502, lng: 8.3093 },
  { city: "St. Gallen", lat: 47.4233, lng: 9.3700 },
  { city: "Winterthur", lat: 47.5001, lng: 8.7237 },
  { city: "Lugano", lat: 46.0037, lng: 8.9511 },
  { city: "Biel/Bienne", lat: 47.1325, lng: 7.2467 },
  { city: "Thun", lat: 46.7545, lng: 7.6295 },
  { city: "Fribourg", lat: 46.8032, lng: 7.1513 },
  { city: "Chur", lat: 46.8530, lng: 9.5288 },
  { city: "Neuchâtel", lat: 46.9945, lng: 6.9380 },
  { city: "Sion", lat: 46.2333, lng: 7.3597 },
];

const CATEGORIES = ["haircut", "plumbing", "electrician", "home_cleaning", "beauty", "ac_cleaning", "appliance_repair"];

const PROVIDER_TEMPLATES: Record<string, { names: string[]; basePrice: number }> = {
  haircut: { names: ["Barbershop", "Coiffure", "Hair Studio", "Schnitt Studio", "Friseur"], basePrice: 42 },
  plumbing: { names: ["Sanitär", "Plomberie", "Plumbing Co", "Rohr Service", "Idraulico"], basePrice: 110 },
  electrician: { names: ["Elektro", "Électricien", "Electric Pro", "Volt Service", "Elektrik"], basePrice: 98 },
  home_cleaning: { names: ["Reinigung", "Nettoyage", "Clean Pro", "Sauber Service", "Pulizia"], basePrice: 82 },
  beauty: { names: ["Beauty Studio", "Beauté Salon", "Glow Studio", "Esthétique", "Bellezza"], basePrice: 62 },
  ac_cleaning: { names: ["Klimaservice", "CoolAir", "AC Clean Pro", "Clima Service"], basePrice: 85 },
  appliance_repair: { names: ["Appliance Fix", "Geräte Reparatur", "Repair Pro", "Handyman Service"], basePrice: 105 },
};

const PROVIDER_TYPES = ["company", "agency", "individual"] as const;

interface DemoProvider {
  business_name: string;
  service_category: string;
  lat: number;
  lng: number;
  rating: number;
  base_price: number;
  provider_type: string;
}

function generateProviders(): DemoProvider[] {
  const providers: DemoProvider[] = [];
  const usedNames = new Set<string>();

  for (const center of CITY_CENTERS) {
    // For each city, create providers for every category within 35km
    for (const cat of CATEGORIES) {
      const templates = PROVIDER_TEMPLATES[cat];
      // 2-3 providers per category per city
      const count = cat === "haircut" || cat === "home_cleaning" ? 3 : 2;

      for (let i = 0; i < count; i++) {
        // Spread providers within ~20km of city center (well within 35km)
        const offsetLat = (Math.random() - 0.5) * 0.18; // ~10km
        const offsetLng = (Math.random() - 0.5) * 0.25;
        const nameBase = templates.names[i % templates.names.length];
        let bizName = `${center.city} ${nameBase}`;
        if (usedNames.has(bizName)) bizName = `${bizName} ${i + 1}`;
        usedNames.add(bizName);

        const typeIdx = i % PROVIDER_TYPES.length;
        providers.push({
          business_name: bizName,
          service_category: cat,
          lat: center.lat + offsetLat,
          lng: center.lng + offsetLng,
          rating: Math.round((4.0 + Math.random() * 0.9) * 10) / 10,
          base_price: templates.basePrice + Math.round((Math.random() - 0.3) * 20),
          provider_type: PROVIDER_TYPES[typeIdx],
        });
      }
    }
  }
  return providers;
}

function generatePassword() {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const DEMO_PROVIDERS = generateProviders();
    let created = 0;
    const providerUserIds: string[] = [];

    for (const demo of DEMO_PROVIDERS) {
      const email = `${demo.business_name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)}@demo.local`;
      const password = generatePassword();

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: demo.business_name, role: "provider" },
      });

      if (authError) {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(u => u.email === email);
        if (existing) {
          providerUserIds.push(existing.id);
          await supabase.from("providers").upsert({
            user_id: existing.id,
            business_name: demo.business_name,
            service_category: demo.service_category,
            latitude: demo.lat,
            longitude: demo.lng,
            rating: demo.rating,
            base_price_chf: demo.base_price,
            provider_type: demo.provider_type,
          }, { onConflict: "user_id" });
          created++;
        }
        continue;
      }

      if (authData?.user) {
        providerUserIds.push(authData.user.id);
        await supabase.from("profiles").update({
          role: "provider",
          display_name: demo.business_name,
          location_lat: demo.lat,
          location_lng: demo.lng,
          location_name: demo.business_name.split(" ")[0],
        }).eq("user_id", authData.user.id);

        await supabase.from("providers").insert({
          user_id: authData.user.id,
          business_name: demo.business_name,
          service_category: demo.service_category,
          latitude: demo.lat,
          longitude: demo.lng,
          rating: demo.rating,
          base_price_chf: demo.base_price,
          provider_type: demo.provider_type,
        });
        created++;
      }
    }

    // --- Admin account ---
    const adminEmail = "admin@quickserve.ch";
    const adminPassword = "pAss123!(";
    let adminCreated = false;

    // Try delete existing admin first
    const { data: existingAdminUsers } = await supabase.auth.admin.listUsers();
    const oldAdmin = existingAdminUsers?.users?.find(u => u.email === adminEmail);
    if (oldAdmin) {
      // Update password and ensure admin role
      await supabase.auth.admin.updateUserById(oldAdmin.id, { password: adminPassword });
      await supabase.from("profiles").update({ display_name: "QuickServe Admin" }).eq("user_id", oldAdmin.id);
      await supabase.from("user_roles").upsert({ user_id: oldAdmin.id, role: "admin" }, { onConflict: "user_id,role" });
      adminCreated = true;
    } else {
      const { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { display_name: "QuickServe Admin", role: "customer" },
      });
      if (!adminErr && adminAuth?.user) {
        await supabase.from("profiles").update({ display_name: "QuickServe Admin" }).eq("user_id", adminAuth.user.id);
        await supabase.from("user_roles").upsert({ user_id: adminAuth.user.id, role: "admin" }, { onConflict: "user_id,role" });
        adminCreated = true;
      }
    }

    // --- Customer Service / Manager account ---
    const csEmail = "customercare@quickserve.ch";
    const csPassword = "pAss123!(";
    let csCreated = false;

    const oldCS = existingAdminUsers?.users?.find(u => u.email === csEmail);
    if (oldCS) {
      await supabase.auth.admin.updateUserById(oldCS.id, { password: csPassword });
      await supabase.from("profiles").update({ display_name: "Customer Care Manager" }).eq("user_id", oldCS.id);
      await supabase.from("user_roles").upsert({ user_id: oldCS.id, role: "customer_service" }, { onConflict: "user_id,role" });
      csCreated = true;
    } else {
      const { data: csAuth, error: csErr } = await supabase.auth.admin.createUser({
        email: csEmail,
        password: csPassword,
        email_confirm: true,
        user_metadata: { display_name: "Customer Care Manager", role: "customer" },
      });
      if (!csErr && csAuth?.user) {
        await supabase.from("profiles").update({ display_name: "Customer Care Manager" }).eq("user_id", csAuth.user.id);
        await supabase.from("user_roles").upsert({ user_id: csAuth.user.id, role: "customer_service" }, { onConflict: "user_id,role" });
        csCreated = true;
      }
    }

    // --- Demo customer & bookings ---
    const custEmail = "demo.customer@quickserve.ch";
    const custPassword = generatePassword();
    let customerId: string | null = null;

    const { data: custAuth, error: custErr } = await supabase.auth.admin.createUser({
      email: custEmail, password: custPassword, email_confirm: true,
      user_metadata: { display_name: "Demo Customer", role: "customer" },
    });
    if (!custErr && custAuth?.user) {
      customerId = custAuth.user.id;
    } else {
      const existing = existingAdminUsers?.users?.find(u => u.email === custEmail);
      if (existing) customerId = existing.id;
    }

    let bookingsCreated = 0;
    if (customerId && providerUserIds.length > 0) {
      for (let i = 0; i < providerUserIds.length && i < 30; i += 3) {
        const providerId = providerUserIds[i];
        const demo = DEMO_PROVIDERS[i];
        if (!demo) continue;

        const { data: sr } = await supabase.from("service_requests").insert({
          customer_id: customerId,
          title: `${demo.service_category} service`,
          category: demo.service_category,
          location_lat: demo.lat, location_lng: demo.lng,
          location_name: demo.business_name.split(" ")[0],
          requested_time: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
          status: "completed",
        }).select("id").single();
        if (!sr) continue;

        const { data: bid } = await supabase.from("bids").insert({
          request_id: sr.id, provider_id: providerId,
          price: demo.base_price, status: "accepted", message: "Happy to help!",
        }).select("id").single();
        if (!bid) continue;

        const { error: bkErr } = await supabase.from("bookings").insert({
          request_id: sr.id, bid_id: bid.id,
          customer_id: customerId, provider_id: providerId,
          status: "completed", final_price_chf: demo.base_price,
        });
        if (!bkErr) {
          bookingsCreated++;
          await supabase.from("reviews").insert({
            booking_id: bid.id, reviewer_id: customerId, reviewee_id: providerId,
            rating: Math.floor(Math.random() * 2) + 4,
            comment: ["Great service!", "Very professional", "Would recommend", "On time and efficient", "Excellent work"][Math.floor(Math.random() * 5)],
          });
        }
      }
    }

    return new Response(JSON.stringify({
      providers_created: created,
      total_providers: DEMO_PROVIDERS.length,
      admin_created: adminCreated,
      cs_created: csCreated,
      bookings_created: bookingsCreated,
      admin_login: { email: adminEmail, password: adminPassword },
      cs_login: { email: csEmail, password: csPassword },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Seed error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
