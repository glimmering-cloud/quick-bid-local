import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEMO_PROVIDERS = [
  // Zurich
  { business_name: "Marco's Barbershop", service_category: "haircut", lat: 47.3775, lng: 8.5400, rating: 4.8, base_price: 45 },
  { business_name: "Züri Cuts", service_category: "haircut", lat: 47.3750, lng: 8.5450, rating: 4.5, base_price: 40 },
  { business_name: "Swiss Blade Studio", service_category: "haircut", lat: 47.3790, lng: 8.5380, rating: 4.9, base_price: 55 },
  { business_name: "Zürich Plumbing Co", service_category: "plumbing", lat: 47.3780, lng: 8.5430, rating: 4.6, base_price: 120 },
  { business_name: "SwissFlow Plumbers", service_category: "plumbing", lat: 47.3730, lng: 8.5470, rating: 4.3, base_price: 100 },
  { business_name: "CoolAir Zürich", service_category: "ac_cleaning", lat: 47.3760, lng: 8.5440, rating: 4.4, base_price: 80 },
  { business_name: "ZüriVolt Electric", service_category: "electrician", lat: 47.3785, lng: 8.5410, rating: 4.7, base_price: 100 },
  { business_name: "SparkleClean Zürich", service_category: "home_cleaning", lat: 47.3770, lng: 8.5420, rating: 4.6, base_price: 85 },
  { business_name: "Glow Studio Zürich", service_category: "beauty", lat: 47.3765, lng: 8.5430, rating: 4.7, base_price: 60 },
  // Bern
  { business_name: "Bern Barbers", service_category: "haircut", lat: 46.9485, lng: 7.4480, rating: 4.6, base_price: 42 },
  { business_name: "Bern Rohr Service", service_category: "plumbing", lat: 46.9490, lng: 7.4460, rating: 4.5, base_price: 115 },
  { business_name: "BernClean Haus", service_category: "home_cleaning", lat: 46.9475, lng: 7.4490, rating: 4.7, base_price: 80 },
  { business_name: "Elektro Bern", service_category: "electrician", lat: 46.9500, lng: 7.4500, rating: 4.4, base_price: 95 },
  { business_name: "Beauty Salon Bern", service_category: "beauty", lat: 46.9470, lng: 7.4470, rating: 4.8, base_price: 65 },
  // Lausanne
  { business_name: "Lausanne Coiffure", service_category: "haircut", lat: 46.5170, lng: 6.6300, rating: 4.7, base_price: 50 },
  { business_name: "LacLéman Plomberie", service_category: "plumbing", lat: 46.5175, lng: 6.6280, rating: 4.5, base_price: 125 },
  { business_name: "Lausanne Nettoyage", service_category: "home_cleaning", lat: 46.5165, lng: 6.6290, rating: 4.6, base_price: 90 },
  { business_name: "Beauté Lausanne", service_category: "beauty", lat: 46.5180, lng: 6.6270, rating: 4.9, base_price: 70 },
  // Geneva
  { business_name: "Genève Style", service_category: "haircut", lat: 46.2105, lng: 6.1430, rating: 4.8, base_price: 55 },
  { business_name: "Plombier Genève", service_category: "plumbing", lat: 46.2095, lng: 6.1420, rating: 4.4, base_price: 130 },
  { business_name: "Geneva Clean Pro", service_category: "home_cleaning", lat: 46.2110, lng: 6.1440, rating: 4.6, base_price: 95 },
  { business_name: "Électricien Genève", service_category: "electrician", lat: 46.2090, lng: 6.1450, rating: 4.7, base_price: 110 },
  // Basel
  { business_name: "Basel Barber House", service_category: "haircut", lat: 47.5480, lng: 7.5900, rating: 4.6, base_price: 43 },
  { business_name: "Rhein Sanitär", service_category: "plumbing", lat: 47.5585, lng: 7.5885, rating: 4.5, base_price: 118 },
  { business_name: "Basel Sauber", service_category: "home_cleaning", lat: 47.5570, lng: 7.5870, rating: 4.7, base_price: 82 },
  { business_name: "Basel Elektrik", service_category: "electrician", lat: 47.5550, lng: 7.5900, rating: 4.3, base_price: 98 },
  // Lucerne
  { business_name: "Luzern Schnitt", service_category: "haircut", lat: 47.0505, lng: 8.3100, rating: 4.7, base_price: 44 },
  { business_name: "Luzern Sanitär", service_category: "plumbing", lat: 47.0435, lng: 8.3155, rating: 4.6, base_price: 112 },
  { business_name: "SeeClean Luzern", service_category: "home_cleaning", lat: 47.0510, lng: 8.3080, rating: 4.8, base_price: 88 },
  // St. Gallen
  { business_name: "StGallen Friseur", service_category: "haircut", lat: 47.4238, lng: 9.3710, rating: 4.5, base_price: 40 },
  { business_name: "Ost-Sanitär", service_category: "plumbing", lat: 47.4248, lng: 9.3770, rating: 4.4, base_price: 105 },
  // Winterthur
  { business_name: "Winterthur Cuts", service_category: "haircut", lat: 47.5005, lng: 8.7240, rating: 4.6, base_price: 41 },
  { business_name: "Winterthur Electric", service_category: "electrician", lat: 47.4995, lng: 8.7295, rating: 4.5, base_price: 96 },
  // Lugano
  { business_name: "Lugano Barber", service_category: "haircut", lat: 46.0040, lng: 8.9515, rating: 4.7, base_price: 48 },
  { business_name: "Lugano Pulizia", service_category: "home_cleaning", lat: 46.0055, lng: 8.9535, rating: 4.5, base_price: 78 },
  // Fribourg
  { business_name: "Fribourg Coiffure", service_category: "haircut", lat: 46.8035, lng: 7.1520, rating: 4.6, base_price: 42 },
  // Chur
  { business_name: "Chur Hairstyle", service_category: "haircut", lat: 46.8535, lng: 9.5290, rating: 4.5, base_price: 39 },
  // Neuchâtel
  { business_name: "Neuchâtel Coiffure", service_category: "haircut", lat: 46.9948, lng: 6.9385, rating: 4.7, base_price: 46 },
  // Sion
  { business_name: "Sion Style", service_category: "haircut", lat: 46.2336, lng: 7.3600, rating: 4.4, base_price: 38 },
  // Thun
  { business_name: "Thun Barbershop", service_category: "haircut", lat: 46.7548, lng: 7.6300, rating: 4.6, base_price: 41 },
  // Biel/Bienne
  { business_name: "Biel Friseur", service_category: "haircut", lat: 47.1328, lng: 7.2470, rating: 4.5, base_price: 40 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let created = 0;
    for (const demo of DEMO_PROVIDERS) {
      const email = `${demo.business_name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)}@demo.local`;
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: "demo123456",
        email_confirm: true,
        user_metadata: { display_name: demo.business_name },
      });

      if (authError) {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(u => u.email === email);
        if (existing) {
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
        await supabase.from("profiles").update({ 
          role: "provider",
          display_name: demo.business_name,
          location_lat: demo.lat,
          location_lng: demo.lng,
          location_name: demo.business_name.split(" ")[0],
        }).eq("user_id", authData.user.id);

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
