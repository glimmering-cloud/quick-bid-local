import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BID_MESSAGES: Record<string, string[]> = {
  haircut: [
    "Available now! I specialize in modern Swiss cuts.",
    "Can be there shortly — 10+ years experience.",
    "Quick and precise — walk-in ready!",
    "Expert in fades, classic, and trending styles.",
    "I'll bring the tools — mobile barber at your service!",
  ],
  plumbing: [
    "Emergency-ready! Tools loaded and on the way.",
    "Licensed plumber — fast diagnostics guaranteed.",
    "No hidden fees — transparent pricing always.",
    "Available immediately with all parts in stock.",
    "Swiss certified — quality work, first time.",
  ],
  ac_cleaning: [
    "Deep-clean specialist — HEPA filtration included.",
    "Eco-friendly cleaning products, Swiss quality.",
    "Full AC service + filter replacement included.",
    "Available today — commercial & residential.",
    "Post-cleaning air quality test included free!",
  ],
  electrician: [
    "Swiss-certified electrician — safety first.",
    "Smart home specialist — modern solutions.",
    "Available now with all standard parts.",
    "Emergency service — fast response guaranteed.",
    "Full diagnostic + repair in one visit.",
  ],
  home_cleaning: [
    "Eco-friendly deep clean — Swiss precision.",
    "Team of 2 for faster service!",
    "All supplies included — just open the door.",
    "Specializing in move-in/move-out cleaning.",
    "Regular clients love our attention to detail!",
  ],
  beauty: [
    "Mobile beauty station — salon experience at home.",
    "Premium products only — Dermalogica & MAC.",
    "Bridal & event specialist available now.",
    "Swiss trained — hygiene-certified studio.",
    "Full treatment menu — nails, skin, hair.",
  ],
  appliance_repair: [
    "All major brands — same-day diagnosis.",
    "Parts in stock for most Swiss appliances.",
    "20+ years fixing home appliances.",
    "Warranty on all repairs — 90 days.",
    "Energy-efficiency check included free!",
  ],
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

    const messages = BID_MESSAGES[serviceRequest.category] || BID_MESSAGES.haircut;

    const bids = [];
    for (let i = 0; i < numBids; i++) {
      const provider = providers[i];
      if (!provider) continue;

      const basePrice = provider.base_price_chf ? Number(provider.base_price_chf) : (30 + Math.random() * 80);
      const variation = 0.85 + Math.random() * 0.3;
      const price = Math.round(basePrice * variation);
      const waitMin = Math.round(5 + Math.random() * 20);

      bids.push({
        request_id,
        provider_id: provider.user_id,
        price,
        estimated_wait_minutes: waitMin,
        message: messages[i % messages.length],
        delay_ms: (i + 1) * 1200 + Math.random() * 800, // Fast: 1.2-2s between bids
      });
    }

    if (bids.length === 0) {
      await supabase.from("service_requests").update({ status: "bidding" }).eq("id", request_id);
      return new Response(JSON.stringify({ simulated: 0, message: "No providers available" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
