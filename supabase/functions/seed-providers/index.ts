import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROVIDER_TYPES = ["company", "agency", "individual"] as const;

const DEMO_PROVIDERS = [
  // Zurich - many providers
  { business_name: "Marco's Barbershop", service_category: "haircut", lat: 47.3775, lng: 8.5400, rating: 4.8, base_price: 45, provider_type: "company" },
  { business_name: "Züri Cuts", service_category: "haircut", lat: 47.3750, lng: 8.5450, rating: 4.5, base_price: 40, provider_type: "company" },
  { business_name: "Swiss Blade Studio", service_category: "haircut", lat: 47.3790, lng: 8.5380, rating: 4.9, base_price: 55, provider_type: "agency" },
  { business_name: "Zürich Plumbing Co", service_category: "plumbing", lat: 47.3780, lng: 8.5430, rating: 4.6, base_price: 120, provider_type: "company" },
  { business_name: "SwissFlow Plumbers", service_category: "plumbing", lat: 47.3730, lng: 8.5470, rating: 4.3, base_price: 100, provider_type: "agency" },
  { business_name: "CoolAir Zürich", service_category: "ac_cleaning", lat: 47.3760, lng: 8.5440, rating: 4.4, base_price: 80, provider_type: "company" },
  { business_name: "ZüriVolt Electric", service_category: "electrician", lat: 47.3785, lng: 8.5410, rating: 4.7, base_price: 100, provider_type: "company" },
  { business_name: "SparkleClean Zürich", service_category: "home_cleaning", lat: 47.3770, lng: 8.5420, rating: 4.6, base_price: 85, provider_type: "agency" },
  { business_name: "Glow Studio Zürich", service_category: "beauty", lat: 47.3765, lng: 8.5430, rating: 4.7, base_price: 60, provider_type: "company" },
  { business_name: "Hans Müller Barber", service_category: "haircut", lat: 47.4115, lng: 8.5445, rating: 4.2, base_price: 35, provider_type: "individual" },
  { business_name: "Elena Styling", service_category: "beauty", lat: 47.3665, lng: 8.5490, rating: 4.1, base_price: 50, provider_type: "individual" },
  { business_name: "Zürich Appliance Fix", service_category: "appliance_repair", lat: 47.3915, lng: 8.4890, rating: 4.5, base_price: 110, provider_type: "company" },
  // Bern
  { business_name: "Bern Barbers", service_category: "haircut", lat: 46.9485, lng: 7.4480, rating: 4.6, base_price: 42, provider_type: "company" },
  { business_name: "Bern Rohr Service", service_category: "plumbing", lat: 46.9490, lng: 7.4460, rating: 4.5, base_price: 115, provider_type: "company" },
  { business_name: "BernClean Haus", service_category: "home_cleaning", lat: 46.9475, lng: 7.4490, rating: 4.7, base_price: 80, provider_type: "agency" },
  { business_name: "Elektro Bern", service_category: "electrician", lat: 46.9500, lng: 7.4500, rating: 4.4, base_price: 95, provider_type: "company" },
  { business_name: "Beauty Salon Bern", service_category: "beauty", lat: 46.9470, lng: 7.4470, rating: 4.8, base_price: 65, provider_type: "company" },
  { business_name: "Fritz Handyman", service_category: "appliance_repair", lat: 46.9635, lng: 7.4675, rating: 4.0, base_price: 90, provider_type: "individual" },
  // Lausanne
  { business_name: "Lausanne Coiffure", service_category: "haircut", lat: 46.5170, lng: 6.6300, rating: 4.7, base_price: 50, provider_type: "company" },
  { business_name: "LacLéman Plomberie", service_category: "plumbing", lat: 46.5175, lng: 6.6280, rating: 4.5, base_price: 125, provider_type: "company" },
  { business_name: "Lausanne Nettoyage", service_category: "home_cleaning", lat: 46.5165, lng: 6.6290, rating: 4.6, base_price: 90, provider_type: "agency" },
  { business_name: "Beauté Lausanne", service_category: "beauty", lat: 46.5180, lng: 6.6270, rating: 4.9, base_price: 70, provider_type: "company" },
  { business_name: "Lausanne Électricien", service_category: "electrician", lat: 46.5215, lng: 6.6280, rating: 4.3, base_price: 105, provider_type: "company" },
  { business_name: "Pierre Coiffeur", service_category: "haircut", lat: 46.5085, lng: 6.6270, rating: 4.1, base_price: 38, provider_type: "individual" },
  // Geneva
  { business_name: "Genève Style", service_category: "haircut", lat: 46.2105, lng: 6.1430, rating: 4.8, base_price: 55, provider_type: "company" },
  { business_name: "Plombier Genève", service_category: "plumbing", lat: 46.2095, lng: 6.1420, rating: 4.4, base_price: 130, provider_type: "company" },
  { business_name: "Geneva Clean Pro", service_category: "home_cleaning", lat: 46.2110, lng: 6.1440, rating: 4.6, base_price: 95, provider_type: "agency" },
  { business_name: "Électricien Genève", service_category: "electrician", lat: 46.2090, lng: 6.1450, rating: 4.7, base_price: 110, provider_type: "company" },
  { business_name: "Geneva Beauty Hub", service_category: "beauty", lat: 46.2000, lng: 6.1580, rating: 4.8, base_price: 75, provider_type: "company" },
  { business_name: "Marie Esthéticienne", service_category: "beauty", lat: 46.1845, lng: 6.1395, rating: 4.0, base_price: 45, provider_type: "individual" },
  // Basel
  { business_name: "Basel Barber House", service_category: "haircut", lat: 47.5480, lng: 7.5900, rating: 4.6, base_price: 43, provider_type: "company" },
  { business_name: "Rhein Sanitär", service_category: "plumbing", lat: 47.5585, lng: 7.5885, rating: 4.5, base_price: 118, provider_type: "company" },
  { business_name: "Basel Sauber", service_category: "home_cleaning", lat: 47.5570, lng: 7.5870, rating: 4.7, base_price: 82, provider_type: "agency" },
  { business_name: "Basel Elektrik", service_category: "electrician", lat: 47.5550, lng: 7.5900, rating: 4.3, base_price: 98, provider_type: "company" },
  { business_name: "Basel Klimaservice", service_category: "ac_cleaning", lat: 47.5645, lng: 7.6080, rating: 4.4, base_price: 85, provider_type: "company" },
  // Lucerne
  { business_name: "Luzern Schnitt", service_category: "haircut", lat: 47.0505, lng: 8.3100, rating: 4.7, base_price: 44, provider_type: "company" },
  { business_name: "Luzern Sanitär", service_category: "plumbing", lat: 47.0435, lng: 8.3155, rating: 4.6, base_price: 112, provider_type: "company" },
  { business_name: "SeeClean Luzern", service_category: "home_cleaning", lat: 47.0510, lng: 8.3080, rating: 4.8, base_price: 88, provider_type: "agency" },
  { business_name: "Luzern Beauty", service_category: "beauty", lat: 47.0500, lng: 8.3090, rating: 4.5, base_price: 58, provider_type: "company" },
  // St. Gallen
  { business_name: "StGallen Friseur", service_category: "haircut", lat: 47.4238, lng: 9.3710, rating: 4.5, base_price: 40, provider_type: "company" },
  { business_name: "Ost-Sanitär", service_category: "plumbing", lat: 47.4248, lng: 9.3770, rating: 4.4, base_price: 105, provider_type: "company" },
  { business_name: "StGallen Reinigung", service_category: "home_cleaning", lat: 47.4250, lng: 9.3765, rating: 4.6, base_price: 78, provider_type: "agency" },
  // Winterthur
  { business_name: "Winterthur Cuts", service_category: "haircut", lat: 47.5005, lng: 8.7240, rating: 4.6, base_price: 41, provider_type: "company" },
  { business_name: "Winterthur Electric", service_category: "electrician", lat: 47.4995, lng: 8.7295, rating: 4.5, base_price: 96, provider_type: "company" },
  { business_name: "Winterthur Sauber", service_category: "home_cleaning", lat: 47.4992, lng: 8.7293, rating: 4.3, base_price: 75, provider_type: "agency" },
  // Lugano
  { business_name: "Lugano Barber", service_category: "haircut", lat: 46.0040, lng: 8.9515, rating: 4.7, base_price: 48, provider_type: "company" },
  { business_name: "Lugano Pulizia", service_category: "home_cleaning", lat: 46.0055, lng: 8.9535, rating: 4.5, base_price: 78, provider_type: "agency" },
  { business_name: "Lugano Idraulico", service_category: "plumbing", lat: 46.0042, lng: 8.9520, rating: 4.4, base_price: 115, provider_type: "company" },
  // Fribourg
  { business_name: "Fribourg Coiffure", service_category: "haircut", lat: 46.8035, lng: 7.1520, rating: 4.6, base_price: 42, provider_type: "company" },
  { business_name: "Fribourg Plomberie", service_category: "plumbing", lat: 46.8038, lng: 7.1518, rating: 4.3, base_price: 108, provider_type: "company" },
  // Chur
  { business_name: "Chur Hairstyle", service_category: "haircut", lat: 46.8535, lng: 9.5290, rating: 4.5, base_price: 39, provider_type: "company" },
  { business_name: "Chur Elektro", service_category: "electrician", lat: 46.8538, lng: 9.5295, rating: 4.4, base_price: 92, provider_type: "company" },
  // Neuchâtel
  { business_name: "Neuchâtel Coiffure", service_category: "haircut", lat: 46.9948, lng: 6.9385, rating: 4.7, base_price: 46, provider_type: "company" },
  { business_name: "Neuchâtel Nettoyage", service_category: "home_cleaning", lat: 46.9950, lng: 6.9382, rating: 4.5, base_price: 82, provider_type: "agency" },
  // Sion
  { business_name: "Sion Style", service_category: "haircut", lat: 46.2336, lng: 7.3600, rating: 4.4, base_price: 38, provider_type: "company" },
  { business_name: "Sion Plombier", service_category: "plumbing", lat: 46.2338, lng: 7.3605, rating: 4.3, base_price: 100, provider_type: "company" },
  // Thun
  { business_name: "Thun Barbershop", service_category: "haircut", lat: 46.7548, lng: 7.6300, rating: 4.6, base_price: 41, provider_type: "company" },
  { business_name: "Thun Reinigung", service_category: "home_cleaning", lat: 46.7550, lng: 7.6298, rating: 4.4, base_price: 76, provider_type: "agency" },
  // Biel/Bienne
  { business_name: "Biel Friseur", service_category: "haircut", lat: 47.1328, lng: 7.2470, rating: 4.5, base_price: 40, provider_type: "company" },
  { business_name: "Bienne Électricien", service_category: "electrician", lat: 47.1330, lng: 7.2475, rating: 4.4, base_price: 95, provider_type: "company" },
];

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

    // Create admin user
    const adminEmail = "admin@quickserve.ch";
    const adminPassword = "pAss123!)";
    let adminCreated = false;
    
    const { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { display_name: "QuickServe Admin", role: "customer" },
    });

    if (!adminErr && adminAuth?.user) {
      await supabase.from("profiles").update({
        display_name: "QuickServe Admin",
      }).eq("user_id", adminAuth.user.id);
      
      await supabase.from("user_roles").upsert({
        user_id: adminAuth.user.id,
        role: "admin",
      }, { onConflict: "user_id,role" });
      adminCreated = true;
    } else {
      // Admin may already exist
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingAdmin = existingUsers?.users?.find(u => u.email === adminEmail);
      if (existingAdmin) {
        await supabase.from("user_roles").upsert({
          user_id: existingAdmin.id,
          role: "admin",
        }, { onConflict: "user_id,role" });
        adminCreated = true;
      }
    }

    // Seed demo customer booking data for each provider
    // Create a demo customer
    const custEmail = "demo.customer@quickserve.ch";
    const custPassword = generatePassword();
    let customerId: string | null = null;

    const { data: custAuth, error: custErr } = await supabase.auth.admin.createUser({
      email: custEmail,
      password: custPassword,
      email_confirm: true,
      user_metadata: { display_name: "Demo Customer", role: "customer" },
    });

    if (!custErr && custAuth?.user) {
      customerId = custAuth.user.id;
    } else {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(u => u.email === custEmail);
      if (existing) customerId = existing.id;
    }

    let bookingsCreated = 0;
    if (customerId && providerUserIds.length > 0) {
      // Create a completed booking for every 3rd provider
      for (let i = 0; i < providerUserIds.length; i += 3) {
        const providerId = providerUserIds[i];
        const demo = DEMO_PROVIDERS[i];
        if (!demo) continue;

        // Create a completed service request
        const { data: sr } = await supabase.from("service_requests").insert({
          customer_id: customerId,
          title: `${demo.service_category} service`,
          category: demo.service_category,
          location_lat: demo.lat,
          location_lng: demo.lng,
          location_name: demo.business_name.split(" ")[0],
          requested_time: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
          status: "completed",
        }).select("id").single();

        if (!sr) continue;

        // Create accepted bid
        const { data: bid } = await supabase.from("bids").insert({
          request_id: sr.id,
          provider_id: providerId,
          price: demo.base_price,
          status: "accepted",
          message: "Happy to help!",
        }).select("id").single();

        if (!bid) continue;

        // Create completed booking
        const { error: bkErr } = await supabase.from("bookings").insert({
          request_id: sr.id,
          bid_id: bid.id,
          customer_id: customerId,
          provider_id: providerId,
          status: "completed",
          final_price_chf: demo.base_price,
        });

        if (!bkErr) {
          bookingsCreated++;
          // Add a review
          await supabase.from("reviews").insert({
            booking_id: bid.id,
            reviewer_id: customerId,
            reviewee_id: providerId,
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
      bookings_created: bookingsCreated,
      admin_login: adminCreated ? { email: adminEmail, password: adminPassword } : null,
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
