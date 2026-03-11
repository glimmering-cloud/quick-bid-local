import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, MapPin, Clock, ChevronRight, Banknote, Sparkles, Zap } from "lucide-react";
import { NaturalLanguageInput } from "@/components/NaturalLanguageInput";
import { ServiceMap } from "@/components/ServiceMap";
import { SERVICE_CATEGORIES, getCategoryById } from "@/lib/categories";
import type { ServiceRequest } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";

const ZURICH_LOCATIONS = [
  { name: "Zurich HB", lat: 47.3769, lng: 8.5417 },
  { name: "Zurich Oerlikon", lat: 47.4111, lng: 8.5441 },
  { name: "Zurich Stadelhofen", lat: 47.3662, lng: 8.5487 },
  { name: "Zurich Altstetten", lat: 47.3912, lng: 8.4887 },
  { name: "Zurich Wiedikon", lat: 47.3717, lng: 8.5206 },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [bidCounts, setBidCounts] = useState<Record<string, number>>({});
  const [lowestBids, setLowestBids] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [useNLP, setUseNLP] = useState(true);
  const [demoMode, setDemoMode] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("haircut");
  const [locationIdx, setLocationIdx] = useState(0);
  const [requestedTime, setRequestedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);

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
          const isOurRequest = requests.some(r => r.id === newBid.request_id);
          if (isOurRequest) {
            toast("🔔 New bid received!", {
              description: `CHF ${Number(newBid.price).toFixed(0)} for your request`,
              action: {
                label: "View",
                onClick: () => navigate(`/request/${newBid.request_id}`),
              },
            });
          }
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, requests.length]);

  const loadRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("service_requests")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);
    if (data && data.length > 0) {
      loadBidCounts(data);
      // Generate heatmap from requests
      setHeatmapPoints(data.map(r => ({ lat: r.location_lat, lng: r.location_lng, intensity: 3 + Math.random() * 4 })));
    }
  };

  const loadProviders = async () => {
    const { data } = await supabase.from("providers").select("*");
    setProviders((data || []).map(p => ({
      id: p.id,
      name: p.business_name,
      lat: p.latitude || 47.377,
      lng: p.longitude || 8.542,
      category: p.service_category,
      rating: Number(p.rating || 4),
      distance_km: 0.5 + Math.random() * 1.5,
    })));
  };

  const loadBidCounts = async (reqs?: ServiceRequest[]) => {
    const requestList = reqs || requests;
    if (requestList.length === 0) return;
    const requestIds = requestList.map(r => r.id);
    const { data: bids } = await supabase
      .from("bids")
      .select("request_id, price")
      .in("request_id", requestIds);

    const counts: Record<string, number> = {};
    const lowest: Record<string, number> = {};
    (bids || []).forEach(b => {
      counts[b.request_id] = (counts[b.request_id] || 0) + 1;
      if (!lowest[b.request_id] || Number(b.price) < lowest[b.request_id]) {
        lowest[b.request_id] = Number(b.price);
      }
    });
    setBidCounts(counts);
    setLowestBids(lowest);
  };

  const handleNLPParsed = (parsed: any) => {
    setTitle(parsed.title || "");
    setDescription(parsed.description || "");
    setCategory(parsed.category || "haircut");
    if (parsed.requested_time) {
      const dt = new Date(parsed.requested_time);
      setRequestedTime(dt.toISOString().slice(0, 16));
    }
    // Match location
    const locIdx = ZURICH_LOCATIONS.findIndex(l =>
      parsed.location_name?.toLowerCase().includes(l.name.toLowerCase().replace("zurich ", ""))
    );
    setLocationIdx(locIdx >= 0 ? locIdx : 0);
    setUseNLP(false); // Switch to manual form to review
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const loc = ZURICH_LOCATIONS[locationIdx];
    const { error } = await supabase.from("service_requests").insert({
      customer_id: user.id,
      title: title || getCategoryById(category).label,
      description,
      category,
      location_lat: loc.lat,
      location_lng: loc.lng,
      location_name: loc.name,
      requested_time: new Date(requestedTime).toISOString(),
    });

    if (error) {
      toast.error(error.message);
    } else {
      const { data: allReqs } = await supabase
        .from("service_requests")
        .select("id")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (allReqs?.[0]) {
        // Match real providers
        const { data: matchResult } = await supabase.functions.invoke("match-providers", {
          body: { request_id: allReqs[0].id },
        });
        const count = matchResult?.matched_count ?? 0;

        // Demo mode: also simulate bids
        if (demoMode) {
          supabase.functions.invoke("simulate-bids", {
            body: { request_id: allReqs[0].id },
          }); // Fire and forget
          toast.success(`Request posted! ${count > 0 ? `${count} providers notified.` : ""} Demo bids incoming...`);
        } else {
          toast.success(
            count > 0
              ? `Request posted! ${count} provider${count > 1 ? "s" : ""} nearby notified.`
              : "Request posted! Providers will see it when they come online."
          );
        }
      } else {
        toast.success("Request posted!");
      }
      setShowForm(false);
      setTitle("");
      setDescription("");
      setRequestedTime("");
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Requests</h1>
          <p className="text-sm text-muted-foreground">Post a service request and get bids from providers nearby</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            <Label htmlFor="demo-mode" className="text-xs text-muted-foreground">Demo</Label>
            <Switch id="demo-mode" checked={demoMode} onCheckedChange={setDemoMode} />
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* Map */}
      <ServiceMap
        center={ZURICH_LOCATIONS[locationIdx]}
        providers={providers}
        heatmapPoints={heatmapPoints}
        className="shadow-sm"
      />

      {showForm && (
        <Card className="animate-fade-in-up border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                New Service Request
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="nlp-toggle" className="text-xs text-muted-foreground">AI Input</Label>
                <Switch id="nlp-toggle" checked={useNLP} onCheckedChange={setUseNLP} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {useNLP ? (
              <NaturalLanguageInput onParsed={handleNLPParsed} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category selector */}
                <div className="space-y-2">
                  <Label>Service Category</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {SERVICE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategory(cat.id);
                          if (!title) setTitle(cat.label);
                        }}
                        className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs transition-all ${
                          category === cat.id
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <cat.icon className="h-4 w-4" />
                        {cat.label.split("/")[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Haircut, Leaking pipe fix" required />
                </div>
                <div className="space-y-2">
                  <Label>Details (optional)</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any preferences or notes..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {ZURICH_LOCATIONS.map((loc, i) => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => setLocationIdx(i)}
                        className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                          locationIdx === i
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <MapPin className="inline h-3.5 w-3.5 mr-1" />
                        {loc.name.replace("Zurich ", "")}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>When</Label>
                  <Input
                    type="datetime-local"
                    value={requestedTime}
                    onChange={(e) => setRequestedTime(e.target.value)}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Posting..." : "Post Request"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {requests.length === 0 && !showForm && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No requests yet</p>
            <p className="text-sm text-muted-foreground/70">Post your first service request to get started</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {requests.map((req) => {
          const count = bidCounts[req.id] || 0;
          const lowest = lowestBids[req.id];
          const cat = getCategoryById(req.category);
          return (
            <Card
              key={req.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
              onClick={() => navigate(`/request/${req.id}`)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.emoji}</span>
                    <h3 className="font-heading font-semibold">{req.title}</h3>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(req.status)}`}>
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
                        {count} bid{count > 1 ? "s" : ""} · from CHF {lowest?.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
