import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Clock, User, ArrowLeft, Send, Check, Banknote, Timer } from "lucide-react";
import type { ServiceRequest, Bid, Profile } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";

type BidWithProfile = Bid & { profiles: Pick<Profile, "display_name" | "avatar_url"> | null };

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [bids, setBids] = useState<BidWithProfile[]>([]);
  const [price, setPrice] = useState("");
  const [estimatedWait, setEstimatedWait] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const prevBidCount = useRef(0);

  const isCustomer = request?.customer_id === user?.id;
  const isProvider = profile?.role === "provider";

  useEffect(() => {
    if (!id) return;
    loadData();

    const channel = supabase
      .channel(`request-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bids", filter: `request_id=eq.${id}` }, (payload) => {
        loadBids();
        // Show toast for customer when new bid arrives
        if (payload.eventType === "INSERT" && isCustomer) {
          const newBid = payload.new as any;
          toast("💈 New bid!", {
            description: `CHF ${Number(newBid.price).toFixed(0)}${newBid.estimated_wait_minutes ? ` · ${newBid.estimated_wait_minutes} min wait` : ""}`,
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `id=eq.${id}` }, () => loadRequest())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, isCustomer]);

  const loadData = () => {
    loadRequest();
    loadBids();
  };

  const loadRequest = async () => {
    if (!id) return;
    const { data } = await supabase.from("service_requests").select("*").eq("id", id).single();
    setRequest(data);
  };

  const loadBids = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("bids")
      .select("*")
      .eq("request_id", id)
      .order("price", { ascending: true });

    if (data && data.length > 0) {
      const providerIds = [...new Set(data.map(b => b.provider_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", providerIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const bidsWithProfiles: BidWithProfile[] = data.map(bid => ({
        ...bid,
        profiles: profileMap.get(bid.provider_id) ? {
          display_name: profileMap.get(bid.provider_id)!.display_name,
          avatar_url: profileMap.get(bid.provider_id)!.avatar_url,
        } : null,
      }));
      setBids(bidsWithProfiles);
    } else {
      setBids([]);
    }
  };

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setSubmitting(true);

    const { error } = await supabase.from("bids").insert({
      request_id: id,
      provider_id: user.id,
      price: parseFloat(price),
      message: message || null,
      estimated_wait_minutes: estimatedWait ? parseInt(estimatedWait) : null,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Bid submitted!");
      setPrice("");
      setMessage("");
      setEstimatedWait("");
      await supabase.from("service_requests").update({ status: "bidding" as any }).eq("id", id);
    }
    setSubmitting(false);
  };

  const handleAcceptBid = async (bid: BidWithProfile) => {
    if (!user || !request) return;

    const { error: bookingError } = await supabase.from("bookings").insert({
      request_id: request.id,
      bid_id: bid.id,
      customer_id: user.id,
      provider_id: bid.provider_id,
      final_price_chf: Number(bid.price),
    });

    if (bookingError) {
      toast.error(bookingError.message);
      return;
    }

    await Promise.all([
      supabase.from("service_requests").update({ status: "confirmed" as any }).eq("id", request.id),
      supabase.from("bids").update({ status: "accepted" as any }).eq("id", bid.id),
      supabase.from("bids").update({ status: "rejected" as any }).eq("request_id", request.id).neq("id", bid.id),
    ]);

    toast.success(`Booking confirmed with ${bid.profiles?.display_name}!`);
    navigate(`/booking/${request.id}`);
  };

  if (!request) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const alreadyBid = bids.some((b) => b.provider_id === user?.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">{request.title}</h1>
              {request.description && <p className="text-muted-foreground mt-1">{request.description}</p>}
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium ${
              request.status === "open" ? "border-success/20 bg-success/10 text-success" :
              request.status === "bidding" ? "border-warning/20 bg-warning/10 text-warning" :
              request.status === "confirmed" ? "border-primary/20 bg-primary/10 text-primary" :
              "border-border bg-muted text-muted-foreground"
            }`}>
              {(request.status === "open" || request.status === "bidding") && (
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
              )}
              {request.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {request.location_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {format(new Date(request.requested_time), "EEEE, MMM d 'at' HH:mm")}
            </span>
          </div>

          {/* Live bid summary for customer */}
          {isCustomer && bids.length > 0 && request.status !== "confirmed" && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{bids.length} bid{bids.length > 1 ? "s" : ""} received</span>
                <span className="text-primary font-semibold">
                  Best: CHF {Number(bids[0].price).toFixed(0)}
                  {bids[0].estimated_wait_minutes && ` · ${bids[0].estimated_wait_minutes} min`}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bids section */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-3">
          Bids {bids.length > 0 && <span className="text-muted-foreground font-normal">({bids.length})</span>}
        </h2>

        {bids.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-8 text-center">
              <Banknote className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                {isCustomer ? "Waiting for barbers to bid..." : "Be the first to bid!"}
              </p>
              {isCustomer && (
                <p className="text-xs text-muted-foreground/60 mt-1">Bids will appear here instantly</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {bids.map((bid, i) => (
            <Card
              key={bid.id}
              className={`transition-all animate-fade-in-up ${i === 0 && bids.length > 1 ? "border-primary/30 shadow-sm" : ""} ${bid.status === "accepted" ? "border-success/30 bg-success/5" : ""}`}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{bid.profiles?.display_name || "Barber"}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {bid.message && <span className="line-clamp-1">{bid.message}</span>}
                      {bid.estimated_wait_minutes && (
                        <span className="flex items-center gap-0.5 text-xs shrink-0">
                          <Timer className="h-3 w-3" />
                          {bid.estimated_wait_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-heading text-xl font-bold">CHF {Number(bid.price).toFixed(0)}</p>
                    {i === 0 && bids.length > 1 && <p className="text-xs text-primary font-medium">Best price</p>}
                  </div>
                  {isCustomer && request.status !== "confirmed" && bid.status === "pending" && (
                    <Button size="sm" onClick={() => handleAcceptBid(bid)}>
                      <Check className="mr-1 h-4 w-4" />
                      Accept
                    </Button>
                  )}
                  {bid.status === "accepted" && (
                    <span className="rounded-full bg-success/10 border border-success/20 px-3 py-1 text-sm font-medium text-success">
                      Accepted
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bid form for providers */}
      {isProvider && !alreadyBid && request.status !== "confirmed" && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Submit Your Bid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBid} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Price (CHF)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 45"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Est. Wait (min)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="5"
                    value={estimatedWait}
                    onChange={(e) => setEstimatedWait(e.target.value)}
                    placeholder="e.g. 15"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Message (optional)</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. 15 years experience, can come to you..."
                  rows={2}
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Bid"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isProvider && alreadyBid && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-primary">✓ You've already submitted a bid for this request</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
