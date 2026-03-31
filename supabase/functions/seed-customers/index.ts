import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEMO_REQUESTS = [
  // Zurich
  { title: "Haircut at home", category: "haircut", lat: 47.3769, lng: 8.5417, location: "Zurich HB", desc: "Need a modern fade cut, preferably at my apartment." },
  { title: "Emergency pipe leak", category: "plumbing", lat: 47.3750, lng: 8.5450, location: "Zurich Stadelhofen", desc: "Water leaking from under the kitchen sink. Urgent!" },
  { title: "AC service needed", category: "ac_cleaning", lat: 47.3790, lng: 8.5380, location: "Zurich Wiedikon", desc: "AC unit not cooling properly, needs deep clean." },
  { title: "Light fixture installation", category: "electrician", lat: 47.4111, lng: 8.5441, location: "Zurich Oerlikon", desc: "Need 3 ceiling lights installed in new apartment." },
  { title: "Deep clean before move-in", category: "home_cleaning", lat: 47.3912, lng: 8.4887, location: "Zurich Altstetten", desc: "3-room apartment needs thorough cleaning." },
  // Bern
  { title: "Beard trim and haircut", category: "haircut", lat: 46.9480, lng: 7.4474, location: "Bern Bahnhof", desc: "Classic cut with beard grooming." },
  { title: "Washing machine repair", category: "appliance_repair", lat: 46.9631, lng: 7.4669, location: "Bern Wankdorf", desc: "Samsung washer won't drain. Error code E21." },
  { title: "Office cleaning weekly", category: "home_cleaning", lat: 46.9414, lng: 7.3916, location: "Bern Bümpliz", desc: "Small office ~50sqm, weekly cleaning contract." },
  // Lausanne
  { title: "Coupe de cheveux femme", category: "haircut", lat: 46.5167, lng: 6.6294, location: "Lausanne Gare", desc: "Coupe et brushing pour cheveux mi-longs." },
  { title: "Fuite robinet salle de bain", category: "plumbing", lat: 46.5210, lng: 6.6275, location: "Lausanne Flon", desc: "Le robinet de la salle de bain fuit constamment." },
  { title: "Facial treatment", category: "beauty", lat: 46.5080, lng: 6.6267, location: "Lausanne Ouchy", desc: "Looking for a deep cleansing facial." },
  // Geneva
  { title: "Full home electrical check", category: "electrician", lat: 46.2100, lng: 6.1426, location: "Genève Cornavin", desc: "Need a full safety inspection of apartment wiring." },
  { title: "Nettoyage de déménagement", category: "home_cleaning", lat: 46.1998, lng: 6.1574, location: "Genève Eaux-Vives", desc: "Grand appartement 5 pièces, nettoyage complet." },
  { title: "Bridal makeup", category: "beauty", lat: 46.1842, lng: 6.1390, location: "Genève Carouge", desc: "Wedding makeup trial + day-of services needed." },
  // Basel
  { title: "Haarschnitt Herren", category: "haircut", lat: 47.5476, lng: 7.5896, location: "Basel SBB", desc: "Klassischer Herrenschnitt mit Waschen." },
  { title: "Klimaanlage Service", category: "ac_cleaning", lat: 47.5579, lng: 7.5880, location: "Basel Marktplatz", desc: "Büro-Klimaanlage reinigen und warten." },
  // Lucerne
  { title: "Kids haircut at home", category: "haircut", lat: 47.0502, lng: 8.3093, location: "Luzern Bahnhof", desc: "Haircut for 2 children (ages 5 and 8) at our home." },
  { title: "Kitchen deep clean", category: "home_cleaning", lat: 47.0430, lng: 8.3150, location: "Luzern Tribschen", desc: "Commercial kitchen needs professional deep clean." },
  // St. Gallen
  { title: "Toilet repair", category: "plumbing", lat: 47.4233, lng: 9.3700, location: "St. Gallen Bahnhof", desc: "Toilet continuously running, needs new flush valve." },
  // Winterthur
  { title: "Socket installation", category: "electrician", lat: 47.5001, lng: 8.7237, location: "Winterthur HB", desc: "Need 4 additional power sockets installed in garage." },
  // Lugano
  { title: "Taglio capelli uomo", category: "haircut", lat: 46.0037, lng: 8.9511, location: "Lugano Stazione", desc: "Taglio moderno con sfumatura." },
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

    let requestsCreated = 0;
    const customerNames = [
      "Anna Meier", "Lukas Brunner", "Sophie Keller", "Marco Frei",
      "Laura Weber", "David Schmid", "Nina Müller", "Thomas Gerber",
      "Elena Rossi", "Yves Favre", "Chiara Bianchi", "Jonas Wyss",
      "Lea Fischer", "Simon Huber", "Mia Steiner", "Patrick Baumann",
      "Sara Moser", "Nils Bachmann", "Julia Zimmermann", "Reto Schneider",
      "Céline Dupont",
    ];

    for (let i = 0; i < DEMO_REQUESTS.length; i++) {
      const demo = DEMO_REQUESTS[i];
      const custName = customerNames[i % customerNames.length];
      const email = `${custName.toLowerCase().replace(/[^a-z]/g, "")}.${i}@demo.local`;
      const password = generatePassword();

      let customerId: string | null = null;

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: custName, role: "customer" },
      });

      if (authError) {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(u => u.email === email);
        if (existing) customerId = existing.id;
      } else if (authData?.user) {
        customerId = authData.user.id;
      }

      if (!customerId) continue;

      // Create an open service request for providers to bid on
      const requestedTime = new Date(Date.now() + (1 + Math.random() * 48) * 3600000).toISOString();
      const { error: reqErr } = await supabase.from("service_requests").insert({
        customer_id: customerId,
        title: demo.title,
        description: demo.desc,
        category: demo.category,
        location_lat: demo.lat,
        location_lng: demo.lng,
        location_name: demo.location,
        requested_time: requestedTime,
        status: "open",
      });

      if (!reqErr) requestsCreated++;
    }

    return new Response(JSON.stringify({
      requests_created: requestsCreated,
      total_customers: DEMO_REQUESTS.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Seed customers error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
