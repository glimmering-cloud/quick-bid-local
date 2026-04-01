import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MapPin, Clock, ChevronRight, Banknote, Sparkles, Zap, Building2, Users, User as UserIcon } from "lucide-react";
import { NaturalLanguageInput } from "@/components/NaturalLanguageInput";
import { ServiceMap } from "@/components/ServiceMap";
import { RaiseTicket } from "@/components/RaiseTicket";
import { BookingHistory } from "@/components/BookingHistory";
import { TransactionHistory } from "@/components/TransactionHistory";
import { SERVICE_CATEGORIES, getCategoryById } from "@/lib/categories";
import { LOCATIONS, CITIES, getLocationsByCity, getCityFromCoords } from "@/lib/locations";
import type { ServiceRequest } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerDashboard() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const requestsRef = useRef<ServiceRequest[]>([]);
  const [bidCounts, setBidCounts] = useState<Record<string, number>>({});
  const [lowestBids, setLowestBids] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [useNLP, setUseNLP] = useState(true);
  const [demoMode, setDemoMode] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("haircut");

  // Determine customer's city from their profile location
  const userCity = profile?.location_lat && profile?.location_lng
    ? getCityFromCoords(profile.location_lat, profile.location_lng)
    : null;
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [locationIdx, setLocationIdx] = useState(0);
  const [requestedTime, setRequestedTime] = useState("");
  const [preferredProviderType, setPreferredProviderType] = useState("any");
  const [submitting, setSubmitting] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);

  // Lock city to user's profile city once known
  useEffect(() => {
    if (userCity) {
      setSelectedCity(userCity);
      setLocationIdx(0);
    }
  }, [userCity]);

  const cityLocations = getLocationsByCity(selectedCity);
  const allLocations = LOCATIONS;
  const currentLocation = cityLocations[locationIdx] || allLocations[0];

  useEffect(() => { requestsRef.current = requests; }, [requests]);

  const loadBidCounts = useCallback(async (reqs?: ServiceRequest[]) => {
    const requestList = reqs || requestsRef.current;
    if (requestList.length === 0) return;
    const requestIds = requestList.map(r => r.id);
    const { data: bids } = await supabase.from("bids").select("request_id, price").in("request_id", requestIds);
    const counts: Record<string, number> = {};
    const lowest: Record<string, number> = {};
    (bids || []).forEach(b => {
      counts[b.request_id] = (counts[b.request_id] || 0) + 1;
      if (!lowest[b.request_id] || Number(b.price) < lowest[b.request_id]) lowest[b.request_id] = Number(b.price);
    });
    setBidCounts(counts);
    setLowestBids(lowest);
  }, []);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("service_requests").select("*").eq("customer_id", user.id).order("created_at", { ascending: false });
    const reqs = data || [];
    setRequests(reqs);
    if (reqs.length > 0) {
      loadBidCounts(reqs);
      setHeatmapPoints(reqs.map(r => ({ lat: r.location_lat, lng: r.location_lng, intensity: 3 + Math.random() * 4 })));
    }
  }, [user, loadBidCounts]);

  const loadProviders = useCallback(async () => {
    const { data } = await supabase.from("providers").select("*").neq("provider_type", "individual");
    setProviders((data || []).map(p => ({
      id: p.id, name: p.business_name, lat: p.latitude || 47.377, lng: p.longitude || 8.542,
      category: p.service_category, rating: Number(p.rating || 4), distance_km: 0.5 + Math.random() * 1.5,
      price: Number(p.base_price_chf || 0),
    })));
  }, []);

  useEffect(() => {
    if (!user) return;
    loadRequests();
    loadProviders();

    const channel = supabase
      .channel("customer-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `customer_id=eq.${user.id}` }, () => loadRequests())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bids" }, (payload) => {
        const newBid = payload.new as any;
        loadBidCounts().then(() => {
          const isOurRequest = requestsRef.current.some(r => r.id === newBid.request_id);
          if (isOurRequest) {
            toast(`🔔 ${t("dashboard.newBidReceived")}`, {
              description: `CHF ${Number(newBid.price).toFixed(0)} ${t("dashboard.forYourRequest")}`,
              action: { label: t("dashboard.view"), onClick: () => navigate(`/request/${newBid.request_id}`) },
            });
          }
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loadRequests, loadProviders, loadBidCounts, navigate, t]);

  const handleNLPParsed = (parsed: any) => {
    setTitle(parsed.title || "");
    setDescription(parsed.description || "");
    setCategory(parsed.category || "haircut");
    if (parsed.requested_time) {
      const dt = new Date(parsed.requested_time);
      setRequestedTime(dt.toISOString().slice(0, 16));
    }
    // Try to match parsed location to our locations
    const locIdx = allLocations.findIndex(l =>
      parsed.location_name?.toLowerCase().includes(l.name.toLowerCase().replace(/^(zurich|bern|lausanne|genève) /i, ""))
    );
    if (locIdx >= 0) {
      const loc = allLocations[locIdx];
      setSelectedCity(loc.city);
      const cityLocs = getLocationsByCity(loc.city);
      setLocationIdx(cityLocs.findIndex(cl => cl.name === loc.name));
    }
    setUseNLP(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!requestedTime) { toast.error(t("dashboard.selectTime")); return; }
    setSubmitting(true);

    const loc = currentLocation;
    const { error } = await supabase.from("service_requests").insert({
      customer_id: user.id,
      title: title || getCategoryById(category).label,
      description, category,
      location_lat: loc.lat, location_lng: loc.lng, location_name: loc.name,
      requested_time: new Date(requestedTime).toISOString(),
      preferred_provider_type: preferredProviderType,
    } as any);

    if (error) {
      toast.error(error.message);
    } else {
      const { data: allReqs } = await supabase.from("service_requests").select("id").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(1);
      if (allReqs?.[0]) {
        const { data: matchResult } = await supabase.functions.invoke("match-providers", { body: { request_id: allReqs[0].id } });
        const count = matchResult?.matched_count ?? 0;
        if (demoMode) {
          supabase.functions.invoke("simulate-bids", { body: { request_id: allReqs[0].id } });
          toast.success(`${t("dashboard.posted")} ${count > 0 ? `${count} ${t("dashboard.providersNotified")}` : ""} ${t("dashboard.demoBids")}`);
        } else {
          toast.success(count > 0 ? `${t("dashboard.posted")} ${count} ${count > 1 ? t("dashboard.providersNearby") : t("dashboard.providerNearby")}` : `${t("dashboard.posted")} ${t("dashboard.waitingOnline")}`);
        }
      } else {
        toast.success(t("dashboard.posted"));
      }
      setShowForm(false);
      setTitle(""); setDescription(""); setRequestedTime("");
    }
    setSubmitting(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-success/10 text-success border-success/20";
      case "bidding": return "bg-warning/10 text-warning border-warning/20";
      case "confirmed": return "bg-primary/10 text-primary border-primary/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("dashboard.myRequests")}</h1>
          <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-warning" />
            <Label htmlFor="demo-mode" className="text-xs text-muted-foreground cursor-pointer">{t("dashboard.demo")}</Label>
            <Switch id="demo-mode" checked={demoMode} onCheckedChange={setDemoMode} />
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm" className="rounded-xl gap-1.5">
            <Plus className="h-4 w-4" />
            {t("dashboard.newRequest")}
          </Button>
        </div>
      </div>

      <ServiceMap
        center={currentLocation}
        providers={providers.filter(p => {
          // Haversine distance in km
          const R = 6371;
          const dLat = (p.lat - currentLocation.lat) * Math.PI / 180;
          const dLng = (p.lng - currentLocation.lng) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 + Math.cos(currentLocation.lat * Math.PI/180) * Math.cos(p.lat * Math.PI/180) * Math.sin(dLng/2)**2;
          const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return d <= 35;
        })}
        heatmapPoints={heatmapPoints}
        className="shadow-sm"
      />

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-primary/20 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {t("dashboard.newServiceRequest")}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="nlp-toggle" className="text-xs text-muted-foreground">{t("dashboard.aiInput")}</Label>
                    <Switch id="nlp-toggle" checked={useNLP} onCheckedChange={setUseNLP} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {useNLP ? (
                  <NaturalLanguageInput onParsed={handleNLPParsed} />
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t("dashboard.serviceCategory")}</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {SERVICE_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id} type="button"
                            onClick={() => { setCategory(cat.id); if (!title) setTitle(cat.label); }}
                            className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs transition-all duration-200 ${
                              category === cat.id ? "border-primary bg-primary/5 text-primary font-medium shadow-sm" : "border-border hover:border-muted-foreground/30"
                            }`}
                          >
                            <cat.icon className="h-4 w-4" />
                            {cat.label.split("/")[0].trim()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashboard.title")}</Label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("dashboard.titlePlaceholder")} required />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashboard.details")}</Label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("dashboard.detailsPlaceholder")} rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashboard.location")}</Label>
                      {userCity ? (
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 mb-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{userCity}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{t("dashboard.yourCity", "Your city")}</span>
                        </div>
                      ) : (
                        <Select value={selectedCity} onValueChange={(val) => { setSelectedCity(val); setLocationIdx(0); }}>
                          <SelectTrigger className="w-full mb-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CITIES.map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {cityLocations.map((loc, i) => (
                          <button
                            key={loc.name} type="button" onClick={() => setLocationIdx(i)}
                            className={`rounded-xl border px-3 py-2 text-sm transition-all duration-200 ${
                              locationIdx === i ? "border-primary bg-primary/5 text-primary font-medium shadow-sm" : "border-border hover:border-muted-foreground/30"
                            }`}
                          >
                            <MapPin className="inline h-3.5 w-3.5 mr-1" />
                            {loc.name.replace(/^(Zurich|Bern|Lausanne|Genève) /, "")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashboard.providerType", "Provider Type")}</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: "any", label: t("providerType.any", "Any"), icon: Sparkles },
                          { id: "company", label: t("providerType.company"), icon: Building2 },
                          { id: "agency", label: t("providerType.agency"), icon: Users },
                          { id: "individual", label: t("providerType.individual"), icon: UserIcon },
                        ].map((pt) => (
                          <button
                            key={pt.id} type="button"
                            onClick={() => setPreferredProviderType(pt.id)}
                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-all duration-200 ${
                              preferredProviderType === pt.id ? "border-primary bg-primary/5 text-primary font-medium shadow-sm" : "border-border hover:border-muted-foreground/30"
                            }`}
                          >
                            <pt.icon className="h-3.5 w-3.5" />
                            {pt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashboard.when")}</Label>
                      <Input type="datetime-local" value={requestedTime} onChange={(e) => setRequestedTime(e.target.value)} required min={new Date().toISOString().slice(0, 16)} />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={submitting} className="rounded-xl">
                        {submitting ? t("dashboard.posting") : t("dashboard.postRequest")}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t("dashboard.cancel")}</Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {requests.length === 0 && !showForm && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">{t("dashboard.noRequests")}</p>
            <p className="text-sm text-muted-foreground/70 mt-1">{t("dashboard.noRequestsSubtitle")}</p>
            <Button onClick={() => setShowForm(true)} size="sm" variant="outline" className="mt-4 rounded-xl gap-1.5">
              <Plus className="h-4 w-4" />
              {t("dashboard.createRequest")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {requests.map((req, i) => {
          const count = bidCounts[req.id] || 0;
          const lowest = lowestBids[req.id];
          const cat = getCategoryById(req.category);
          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Card
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20"
                onClick={() => navigate(`/request/${req.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{cat.emoji}</span>
                      <h3 className="font-heading font-semibold truncate">{req.title}</h3>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${statusColor(req.status)}`}>
                        {(req.status === "open" || req.status === "bidding") && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />}
                        {req.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {req.location_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(req.requested_time), "MMM d, HH:mm")}
                      </span>
                      {count > 0 && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Banknote className="h-3.5 w-3.5" />
                          {count} {t("dashboard.bids")} · {t("dashboard.from")} {lowest?.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/30 shrink-0 ml-2" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <BookingHistory role="customer" />
      <TransactionHistory role="customer" />

      <div className="flex justify-center">
        <RaiseTicket />
      </div>
    </motion.div>
  );
}
