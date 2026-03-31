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

    // Verify the calling user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { request_id } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "request_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the service request
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

    // Find matching providers using the DB function with provider type filter
    const radiusKm = serviceRequest.radius_km ?? 35.0;
    const prefType = serviceRequest.preferred_provider_type ?? "any";
    const { data: matchedProviders, error: matchError } = await supabase.rpc(
      "find_matching_providers",
      {
        req_lat: serviceRequest.location_lat,
        req_lng: serviceRequest.location_lng,
        req_category: serviceRequest.category,
        radius_km: radiusKm,
        pref_provider_type: prefType,
      }
    );

    if (matchError) {
      console.error("Match error:", matchError);
      return new Response(JSON.stringify({ error: "Matching failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const providers = matchedProviders || [];

    // Create notifications for all matched providers simultaneously
    if (providers.length > 0) {
      const notifications = providers.map((p: any) => ({
        user_id: p.provider_user_id,
        request_id: serviceRequest.id,
        type: "new_request",
        message: `New ${serviceRequest.category} request near ${serviceRequest.location_name}: "${serviceRequest.title}"`,
      }));

      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error("Notification insert error:", notifError);
      }
    }

    return new Response(
      JSON.stringify({
        matched_count: providers.length,
        providers: providers.map((p: any) => ({
          provider_user_id: p.provider_user_id,
          business_name: p.business_name,
          distance_km: Math.round(p.distance_km * 100) / 100,
        })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
