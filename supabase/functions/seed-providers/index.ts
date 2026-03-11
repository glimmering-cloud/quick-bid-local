import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEMO_PROVIDERS = [
  // Barbers
  { business_name: "Marco's Barbershop", service_category: "haircut", lat: 47.3775, lng: 8.5400, rating: 4.8, base_price: 45 },
  { business_name: "Züri Cuts", service_category: "haircut", lat: 47.3750, lng: 8.5450, rating: 4.5, base_price: 40 },
  { business_name: "Swiss Blade Studio", service_category: "haircut", lat: 47.3790, lng: 8.5380, rating: 4.9, base_price: 55 },
  // Plumbers
  { business_name: "Zürich Plumbing Co", service_category: "plumbing", lat: 47.3780, lng: 8.5430, rating: 4.6, base_price: 120 },
  { business_name: "SwissFlow Plumbers", service_category: "plumbing", lat: 47.3730, lng: 8.5470, rating: 4.3, base_price: 100 },
  { business_name: "AquaFix Services", service_category: "plumbing", lat: 47.3800, lng: 8.5350, rating: 4.7, base_price: 130 },
  // AC Cleaning
  { business_name: "CoolAir Zürich", service_category: "ac_cleaning", lat: 47.3760, lng: 8.5440, rating: 4.4, base_price: 80 },
  { business_name: "Swiss AC Pros", service_category: "ac_cleaning", lat: 47.3740, lng: 8.5390, rating: 4.6, base_price: 90 },
  { business_name: "FreshBreeze HVAC", service_category: "ac_cleaning", lat: 47.3810, lng: 8.5460, rating: 4.2, base_price: 75 },
  // Electricians
  { business_name: "ZüriVolt Electric", service_category: "electrician", lat: 47.3785, lng: 8.5410, rating: 4.7, base_price: 100 },
  { business_name: "Swiss Spark Services", service_category: "electrician", lat: 47.3755, lng: 8.5380, rating: 4.5, base_price: 95 },
  { business_name: "PowerLine Zürich", service_category: "electrician", lat: 47.3720, lng: 8.5450, rating: 4.8, base_price: 110 },
  // Home Cleaning
  { business_name: "SparkleClean Zürich", service_category: "home_cleaning", lat: 47.3770, lng: 8.5420, rating: 4.6, base_price: 85 },
  { business_name: "Swiss Maids Co", service_category: "home_cleaning", lat: 47.3745, lng: 8.5460, rating: 4.4, base_price: 80 },
  { business_name: "TidySpace Zürich", service_category: "home_cleaning", lat: 47.3795, lng: 8.5370, rating: 4.8, base_price: 95 },
  // Beauty
  { business_name: "Glow Studio Zürich", service_category: "beauty", lat: 47.3765, lng: 8.5430, rating: 4.7, base_price: 60 },
  { business_name: "Swiss Beauty Hub", service_category: "beauty", lat: 47.3735, lng: 8.5400, rating: 4.5, base_price: 55 },
  { business_name: "Radiance Zürich", service_category: "beauty", lat: 47.3805, lng: 8.5440, rating: 4.9, base_price: 70 },
  // Appliance Repair
  { business_name: "FixIt Zürich", service_category: "appliance_repair", lat: 47.3778, lng: 8.5415, rating: 4.3, base_price: 110 },
  { business_name: "Swiss Appliance Pros", service_category: "appliance_repair", lat: 47.3748, lng: 8.5435, rating: 4.6, base_price: 105 },
  { business_name: "RepairMaster Co", service_category: "appliance_repair", lat: 47.3815, lng: 8.5395, rating: 4.4, base_price: 115 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Create demo users and providers
    let created = 0;
    for (const demo of DEMO_PROVIDERS) {
      const email = `${demo.business_name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)}@demo.local`;
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: "demo123456",
        email_confirm: true,
        user_metadata: { display_name: demo.business_name },
      });

      if (authError) {
        // User might already exist, try to find them
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(u => u.email === email);
        if (existing) {
          // Upsert provider record
          const { error: provError } = await supabase.from("providers").upsert({
            user_id: existing.id,
            business_name: demo.business_name,
            service_category: demo.service_category,
            latitude: demo.lat,
            longitude: demo.lng,
            rating: demo.rating,
            base_price_chf: demo.base_price,
          }, { onConflict: "user_id" });
          if (!provError) created++;
        }
        continue;
      }

      if (authData?.user) {
        // Update profile to provider role
        await supabase.from("profiles").update({ 
          role: "provider",
          display_name: demo.business_name,
          location_lat: demo.lat,
          location_lng: demo.lng,
          location_name: "Zurich",
        }).eq("user_id", authData.user.id);

        // Create provider record
        const { error: provError } = await supabase.from("providers").insert({
          user_id: authData.user.id,
          business_name: demo.business_name,
          service_category: demo.service_category,
          latitude: demo.lat,
          longitude: demo.lng,
          rating: demo.rating,
          base_price_chf: demo.base_price,
        });
        if (!provError) created++;
      }
    }

    return new Response(JSON.stringify({ created, total: DEMO_PROVIDERS.length }), {
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
