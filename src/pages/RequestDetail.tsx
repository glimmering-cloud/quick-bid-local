import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Clock, ArrowLeft, Send, Check, Banknote, Timer, Star, TrendingUp } from "lucide-react";
import { ServiceMap } from "@/components/ServiceMap";
import { BidRankingCard } from "@/components/BidRankingCard";
import { LiveBiddingIndicator } from "@/components/LiveBiddingIndicator";
import { PriceSuggestion } from "@/components/PriceSuggestion";
import { DemoPaymentGateway } from "@/components/DemoPaymentGateway";
import { rankBids } from "@/lib/ranking";
import { getCategoryById } from "@/lib/categories";
import type { ServiceRequest, Bid, Profile } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PageLoader } from "@/components/LoadingSkeleton";

type BidWithProfile = Bid & { profiles: Pick<Profile, "display_name" | "avatar_url"> | null; provider?: any };

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [bids, setBids] = useState<BidWithProfile[]>([]);
  const [price, setPrice] = useState("");
  const [estimatedWait, setEstimatedWait] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingBid, setPendingBid] = useState<BidWithProfile | null>(null);

  const isCustomer = request?.customer_id === user?.id;
  const isProvider = profile?.role === "provider";

  useEffect(() => {
    if (!id) return;
    loadData();

    const channel = supabase
      .channel(`request-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bids", filter: `request_id=eq.${id}` }, (payload) => {
        loadBids();
        if (payload.eventType === "INSERT" && isCustomer) {
          const newBid = payload.new as any;
          toast(`🔔 ${t("request.newBid")}`, {
            description: `CHF ${Number(newBid.price).toFixed(0)}${newBid.estimated_wait_minutes ? ` · ${newBid.estimated_wait_minutes} min` : ""}`,
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `id=eq.${id}` }, () => loadRequest())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, isCustomer]);

  const loadData = () => { loadRequest(); loadBids(); };

  const loadRequest = async () => {
    if (!id) return;
    const { data } = await supabase.from("service_requests").select("*").eq("id", id).single();
    setRequest(data);
  };

  const loadBids = async () => {
    if (!id) return;
    const { data } = await supabase.from("bids").select("*").eq("request_id", id).order("created_at", { ascending: true });

    if (data && data.length > 0) {
      const providerIds = [...new Set(data.map(b => b.provider_id))];
      const [{ data: profiles }, { data: providerRecords }] = await Promise.all([
        supabase.from("public_profiles").select("user_id, display_name, avatar_url").in("user_id", providerIds),
        supabase.from("providers").select("user_id, business_name, rating, latitude, longitude").in("user_id", providerIds),
      ]);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const providerMap = new Map((providerRecords || []).map(p => [p.user_id, p]));
      
      const bidsWithProfiles: BidWithProfile[] = data.map(bid => ({
        ...bid,
        profiles: profileMap.get(bid.provider_id) ? {
          display_name: providerMap.get(bid.provider_id)?.business_name || profileMap.get(bid.provider_id)!.display_name,
          avatar_url: profileMap.get(bid.provider_id)!.avatar_url,
        } : null,
        provider: providerMap.get(bid.provider_id) || null,
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
      toast.success(t("request.bidSubmitted"));
      setPrice(""); setMessage(""); setEstimatedWait("");
      await supabase.from("service_requests").update({ status: "bidding" as any }).eq("id", id);
    }
    setSubmitting(false);
  };

  const handleAcceptBid = async (bid: BidWithProfile) => {
    if (!user || !request) return;

    const { error: acceptError } = await supabase.from("bids").update({ status: "accepted" as any }).eq("id", bid.id);
    if (acceptError) { toast.error(acceptError.message); return; }

    const { error: bookingError } = await supabase.from("bookings").insert({
      request_id: request.id, bid_id: bid.id, customer_id: user.id, provider_id: bid.provider_id, final_price_chf: Number(bid.price),
    });

    if (bookingError) {
      await supabase.from("bids").update({ status: "pending" as any }).eq("id", bid.id);
      toast.error(bookingError.message);
      return;
    }

    const [requestUpdate, rejectOthers] = await Promise.all([
      supabase.from("service_requests").update({ status: "confirmed" as any }).eq("id", request.id),
      supabase.from("bids").update({ status: "rejected" as any }).eq("request_id", request.id).neq("id", bid.id),
    ]);

    if (requestUpdate.error || rejectOthers.error) {
      toast.error(requestUpdate.error?.message || rejectOthers.error?.message || "Booking completed with partial update");
      return;
    }

    const providerName = bid.provider?.business_name || bid.profiles?.display_name || t("auth.provider");
    toast.success(`${t("request.bookingConfirmed")} ${providerName}!`);
    navigate(`/booking/${request.id}`);
  };

  if (!request) return <PageLoader />;

  const alreadyBid = bids.some((b) => b.provider_id === user?.id);
  const cat = getCategoryById(request.category);
  const rankedBids = rankBids(bids, request.location_lat, request.location_lng);

  const mapProviders = bids
    .filter(b => b.provider?.latitude)
    .map(b => ({
      id: b.provider_id, name: b.profiles?.display_name || "Provider",
      lat: b.provider.latitude, lng: b.provider.longitude,
      category: request.category, rating: Number(b.provider.rating || 4),
      price: Number(b.price), hasBid: true,
    }));

  const statusClasses =
    request.status === "open" ? "border-success/20 bg-success/10 text-success" :
    request.status === "bidding" ? "border-warning/20 bg-warning/10 text-warning" :
    request.status === "confirmed" ? "border-primary/20 bg-primary/10 text-primary" :
    "border-border bg-muted text-muted-foreground";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t("request.back")}
      </button>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{cat.emoji}</span>
                <h1 className="font-heading text-2xl font-bold">{request.title}</h1>
              </div>
              {request.description && <p className="text-muted-foreground mt-1.5">{request.description}</p>}
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium ${statusClasses}`}>
              {(request.status === "open" || request.status === "bidding") && (
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
              )}
              {request.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{request.location_name}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{format(new Date(request.requested_time), "EEEE, MMM d 'at' HH:mm")}</span>
          </div>

          {isCustomer && bids.length > 0 && request.status !== "confirmed" && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{bids.length} {t("request.bidsReceived")}</span>
                <span className="text-primary font-semibold">
                  {t("request.best")}: CHF {Math.min(...bids.map(b => Number(b.price))).toFixed(0)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {mapProviders.length > 0 && (
        <ServiceMap center={{ lat: request.location_lat, lng: request.location_lng }} providers={mapProviders} className="shadow-sm" />
      )}

      {/* Live bidding indicator */}
      {isCustomer && (request.status === "open" || request.status === "bidding") && (
        <LiveBiddingIndicator bidCount={bids.length} isLive={true} />
      )}

      <div>
        <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t("request.bids")} {bids.length > 0 && <span className="text-muted-foreground font-normal text-sm">({bids.length} {t("request.rankedByAi")})</span>}
        </h2>

        {bids.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <Banknote className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {isCustomer ? t("request.waitingForBids") : t("request.beFirst")}
              </p>
              {isCustomer && <p className="text-xs text-muted-foreground/60 mt-1">{t("request.bidsAppear")}</p>}
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {rankedBids.map((ranked, i) => (
            <BidRankingCard key={ranked.bid.id} rankedBid={ranked} index={i} isCustomer={isCustomer} requestConfirmed={request.status === "confirmed"} requestLat={request.location_lat} requestLng={request.location_lng} onAccept={() => handleAcceptBid(ranked.bid)} />
          ))}
        </div>
      </div>

      {isProvider && !alreadyBid && request.status !== "confirmed" && (
        <>
          <PriceSuggestion category={request.category} onAcceptPrice={(p) => setPrice(p.toString())} />
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                {t("request.submitBid")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBid} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t("request.priceCHF")}</Label>
                    <Input type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 45" required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("request.estWait")}</Label>
                    <Input type="number" min="0" step="5" value={estimatedWait} onChange={(e) => setEstimatedWait(e.target.value)} placeholder="e.g. 15" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("request.messageOptional")}</Label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("request.messagePlaceholder")} rows={2} />
                </div>
                <Button type="submit" disabled={submitting} className="rounded-xl">
                  {submitting ? t("request.submitting") : t("request.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {isProvider && alreadyBid && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-primary">✓ {t("request.alreadyBid")}</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
