import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEMO_PROVIDER_NAMES: Record<string, string[]> = {
  haircut: ["Marco's Barbershop", "Züri Cuts", "Swiss Blade Studio", "Alpine Grooming", "Bahnhof Barbers"],
  plumbing: ["Zürich Plumbing Co", "SwissFlow Plumbers", "AquaFix Services", "PipeWorks Zürich", "RapidDrain Solutions"],
  ac_cleaning: ["CoolAir Zürich", "Swiss AC Pros", "Alpine Climate Care", "FreshBreeze HVAC", "CleanAir Solutions"],
  electrician: ["ZüriVolt Electric", "Swiss Spark Services", "PowerLine Zürich", "LightUp Electric", "WireWorks Pro"],
  home_cleaning: ["SparkleClean Zürich", "Swiss Maids Co", "FreshHome Services", "Alpine Clean Team", "TidySpace Zürich"],
  beauty: ["Glow Studio Zürich", "Swiss Beauty Hub", "Elegance Spa", "Belle Beauty Bar", "Radiance Zürich"],
  appliance_repair: ["FixIt Zürich", "Swiss Appliance Pros", "RepairMaster Co", "TechFix Services", "HomeRepair Hub"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { request_id } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "request_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the request
    const { data: serviceRequest, error: reqError } = await supabase
      .from("service_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (reqError || !serviceRequest) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find real providers matching category
    const { data: realProviders } = await supabase
      .from("providers")
      .select("user_id, business_name, base_price_chf, rating, latitude, longitude")
      .eq("service_category", serviceRequest.category);

    const providers = realProviders || [];
    const numBids = Math.min(Math.max(3, providers.length), 5);
    
    // Get category-specific demo names as fallback
    const demoNames = DEMO_PROVIDER_NAMES[serviceRequest.category] || DEMO_PROVIDER_NAMES.haircut;
    
    const bids = [];
    for (let i = 0; i < numBids; i++) {
      const provider = providers[i];
      const basePrice = provider?.base_price_chf ? Number(provider.base_price_chf) : (30 + Math.random() * 80);
      const variation = 0.8 + Math.random() * 0.4;
      const price = Math.round(basePrice * variation);
      const waitMin = Math.round(5 + Math.random() * 25);
      
      if (provider) {
        // Use real provider
        bids.push({
          request_id,
          provider_id: provider.user_id,
          price,
          estimated_wait_minutes: waitMin,
          message: `Available now! ${demoNames[i % demoNames.length]} at your service.`,
          delay_ms: (i + 1) * 2000 + Math.random() * 1500,
        });
      }
    }

    // If no real providers, we can't insert bids (no valid provider_id)
    // But we'll update the request status to show it's active
    if (bids.length === 0) {
      await supabase.from("service_requests").update({ status: "bidding" }).eq("id", request_id);
      return new Response(JSON.stringify({ simulated: 0, message: "No providers available for simulation" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert bids with delays (simulated via sequential inserts with sleep)
    let inserted = 0;
    for (const bid of bids) {
      const delayMs = bid.delay_ms;
      delete (bid as any).delay_ms;
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const { error } = await supabase.from("bids").insert({
        request_id: bid.request_id,
        provider_id: bid.provider_id,
        price: bid.price,
        estimated_wait_minutes: bid.estimated_wait_minutes,
        message: bid.message,
      });
      
      if (!error) {
        inserted++;
        // Update status to bidding after first bid
        if (inserted === 1) {
          await supabase.from("service_requests").update({ status: "bidding" }).eq("id", request_id);
        }
      }
    }

    return new Response(JSON.stringify({ simulated: inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Simulate error:", err);
    return new Response(JSON.stringify({ error: "Simulation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
