import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, ChevronRight, Scissors } from "lucide-react";
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
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("Haircut");
  const [description, setDescription] = useState("");
  const [locationIdx, setLocationIdx] = useState(0);
  const [requestedTime, setRequestedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadRequests();

    const channel = supabase
      .channel("customer-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `customer_id=eq.${user.id}` }, () => loadRequests())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("service_requests")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const loc = ZURICH_LOCATIONS[locationIdx];
    const { error } = await supabase.from("service_requests").insert({
      customer_id: user.id,
      title,
      description,
      category: "haircut",
      location_lat: loc.lat,
      location_lng: loc.lng,
      location_name: loc.name,
      requested_time: new Date(requestedTime).toISOString(),
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Request posted! Barbers nearby will be notified.");
      setShowForm(false);
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
      case "completed": return "bg-muted text-muted-foreground border-border";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Requests</h1>
          <p className="text-sm text-muted-foreground">Post a haircut request and get bids from barbers nearby</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Request
        </Button>
      </div>

      {showForm && (
        <Card className="animate-fade-in-up border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scissors className="h-5 w-5 text-primary" />
              New Haircut Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Service</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Haircut, Beard Trim" required />
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
          </CardContent>
        </Card>
      )}

      {requests.length === 0 && !showForm && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Scissors className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No requests yet</p>
            <p className="text-sm text-muted-foreground/70">Post your first haircut request to get started</p>
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
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold">{req.title}</h3>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(req.status)}`}>
                    {req.status === "open" && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />}
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
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
