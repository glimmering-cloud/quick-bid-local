const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZURICH_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  "zurich hb": { lat: 47.3769, lng: 8.5417 },
  "zurich station": { lat: 47.3769, lng: 8.5417 },
  "hauptbahnhof": { lat: 47.3769, lng: 8.5417 },
  "oerlikon": { lat: 47.4111, lng: 8.5441 },
  "stadelhofen": { lat: 47.3662, lng: 8.5487 },
  "altstetten": { lat: 47.3912, lng: 8.4887 },
  "wiedikon": { lat: 47.3717, lng: 8.5206 },
  "zurich": { lat: 47.3769, lng: 8.5417 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "text required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const systemPrompt = `You are a service request parser for a local services marketplace in Zurich, Switzerland.
Extract structured data from natural language service requests.

Current date/time: ${now.toISOString()}

Available service categories: haircut, plumbing, ac_cleaning, electrician, home_cleaning, beauty, appliance_repair

Available locations in Zurich: Zurich HB (47.3769, 8.5417), Oerlikon (47.4111, 8.5441), Stadelhofen (47.3662, 8.5487), Altstetten (47.3912, 8.4887), Wiedikon (47.3717, 8.5206)

If the user mentions a time like "at 4 PM" or "tomorrow morning", calculate the actual ISO timestamp.
If no location is specified, default to Zurich HB.
If no time specified, use 1 hour from now.
Default radius is 2 km.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_service_request",
              description: "Parse a natural language service request into structured data",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Short title for the request" },
                  category: { type: "string", enum: ["haircut", "plumbing", "ac_cleaning", "electrician", "home_cleaning", "beauty", "appliance_repair"] },
                  description: { type: "string", description: "Detailed description" },
                  location_name: { type: "string", description: "Human-readable location name" },
                  location_lat: { type: "number" },
                  location_lng: { type: "number" },
                  requested_time: { type: "string", description: "ISO 8601 timestamp" },
                  radius_km: { type: "number", description: "Search radius in km" },
                },
                required: ["title", "category", "description", "location_name", "location_lat", "location_lng", "requested_time", "radius_km"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_service_request" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Could not parse request" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ parsed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Parse error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
