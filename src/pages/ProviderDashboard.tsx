import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ChevronRight, Zap, User } from "lucide-react";
import type { ServiceRequest } from "@/lib/types";
import { format } from "date-fns";

export default function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<(ServiceRequest & { profiles: { display_name: string } | null })[]>([]);
  const [myBidRequestIds, setMyBidRequestIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    loadData();

    const channel = supabase
      .channel("provider-requests")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "service_requests" }, () => loadData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "service_requests" }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [{ data: reqs }, { data: bids }] = await Promise.all([
      supabase
        .from("service_requests")
        .select("*")
        .in("status", ["open", "bidding"])
        .order("created_at", { ascending: false }),
      supabase
        .from("bids")
        .select("request_id")
        .eq("provider_id", user.id),
    ]);

    // Fetch customer profiles separately
    const rawReqs = reqs || [];
    if (rawReqs.length > 0) {
      const customerIds = [...new Set(rawReqs.map(r => r.customer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", customerIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setRequests(rawReqs.map(r => ({
        ...r,
        profiles: profileMap.get(r.customer_id) || null,
      })));
    } else {
      setRequests([]);
    }
    setMyBidRequestIds(new Set((bids || []).map((b) => b.request_id)));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Available Requests</h1>
        <p className="text-sm text-muted-foreground">Nearby haircut requests waiting for your bid</p>
      </div>

      {requests.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No requests nearby</p>
            <p className="text-sm text-muted-foreground/70">New requests will appear here in real-time</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {requests.map((req) => (
          <Card
            key={req.id}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
            onClick={() => navigate(`/request/${req.id}`)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold">{req.title}</h3>
                  {myBidRequestIds.has(req.id) && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Bid sent
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
                    {req.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {req.profiles?.display_name || "Customer"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {req.location_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(req.requested_time), "MMM d, HH:mm")}
                  </span>
                </div>
                {req.description && (
                  <p className="text-sm text-muted-foreground/70 line-clamp-1">{req.description}</p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
