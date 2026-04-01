import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategoryById } from "@/lib/categories";
import { format } from "date-fns";
import { History, MapPin, Clock, Star, ChevronRight, ShieldCheck, Loader2, CheckCircle2, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface BookingHistoryProps {
  role: "customer" | "provider";
}

export function BookingHistory({ role }: BookingHistoryProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});
  const [verifying, setVerifying] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;
    const col = role === "customer" ? "customer_id" : "provider_id";
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq(col, user.id)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const requestIds = [...new Set(data.map((b) => b.request_id))];
      const otherUserIds = [...new Set(data.map((b) => role === "customer" ? b.provider_id : b.customer_id))];

      const [{ data: requests }, { data: profiles }, { data: reviews }] = await Promise.all([
        supabase.from("service_requests").select("id, title, category, location_name, requested_time").in("id", requestIds),
        supabase.from("public_profiles").select("user_id, display_name").in("user_id", otherUserIds),
        supabase.from("reviews").select("booking_id, rating, reviewer_id").eq("reviewer_id", user.id),
      ]);

      const requestMap = new Map((requests || []).map((r) => [r.id, r]));
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));
      const reviewMap = new Map((reviews || []).map((r) => [r.booking_id, r.rating]));

      setBookings(
        data.map((b) => ({
          ...b,
          request: requestMap.get(b.request_id),
          otherPartyName: profileMap.get(role === "customer" ? b.provider_id : b.customer_id) || "Unknown",
          myRating: reviewMap.get(b.id),
        }))
      );
    } else {
      setBookings([]);
    }
    setLoading(false);
  };

  const handleVerifyPin = async (booking: any) => {
    const pin = pinInputs[booking.id];
    if (!pin || pin.length !== 4) {
      toast.error("Please enter the 4-digit PIN from the customer");
      return;
    }

    setVerifying(booking.id);

    if (pin !== booking.verification_pin) {
      toast.error("Incorrect PIN. Ask the customer for the correct code.");
      setVerifying(null);
      return;
    }

    const { error } = await supabase.from("bookings").update({
      job_started: true,
      job_started_at: new Date().toISOString(),
      address_revealed: true,
    } as any).eq("id", booking.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("PIN verified! Job started — precise location revealed.");
      loadBookings();
    }
    setVerifying(null);
  };

  const handleMarkComplete = async (booking: any) => {
    setCompletingId(booking.id);
    const { error } = await supabase.from("bookings").update({ status: "completed" as any }).eq("id", booking.id);
    if (error) {
      toast.error(error.message);
    } else {
      await supabase.from("service_requests").update({ status: "completed" as any }).eq("id", booking.request_id);
      toast.success("Job marked as complete!");
      loadBookings();
    }
    setCompletingId(null);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-primary/10 text-primary border-primary/20";
      case "completed": return "bg-success/10 text-success border-success/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) return null;
  if (bookings.length === 0) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          {t("history.title")}
          <span className="text-muted-foreground font-normal text-sm">({bookings.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {bookings.slice(0, 10).map((booking, i) => {
          const req = booking.request;
          const cat = req ? getCategoryById(req.category) : null;
          const showPinInput = role === "provider" && booking.status === "confirmed" && !booking.job_started;
          const showJobStarted = role === "provider" && booking.status === "confirmed" && booking.job_started;
          const isInteractive = showPinInput || showJobStarted;
          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div
                className={`p-3 rounded-lg border transition-colors ${isInteractive ? "" : "hover:bg-accent/50 cursor-pointer"}`}
                onClick={() => !isInteractive && navigate(`/booking/${booking.request_id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {cat && <span>{cat.emoji}</span>}
                      <span className="font-medium text-sm truncate">{req?.title || "Booking"}</span>
                      <Badge variant="outline" className={`text-xs ${statusColor(booking.status)}`}>
                        {booking.status}
                      </Badge>
                      {booking.job_started && booking.status === "confirmed" && (
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                          Job Started
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{booking.otherPartyName}</span>
                      {req?.location_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {req.location_name}
                        </span>
                      )}
                      {req?.requested_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(req.requested_time), "MMM d, HH:mm")}
                        </span>
                      )}
                      {booking.final_price_chf && (
                        <span className="font-medium">CHF {Number(booking.final_price_chf).toFixed(0)}</span>
                      )}
                      {booking.myRating && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {booking.myRating}
                        </span>
                      )}
                    </div>
                  </div>
                  {!showPinInput && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                  )}
                </div>

                {/* Provider PIN verification inline */}
                {showPinInput && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">
                      Enter the 4-digit PIN from the customer to confirm & start the job:
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinInputs[booking.id] || ""}
                        onChange={(e) => setPinInputs(prev => ({ ...prev, [booking.id]: e.target.value.replace(/\D/g, "") }))}
                        placeholder="0000"
                        className="w-24 text-center font-mono text-base tracking-[0.2em]"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleVerifyPin(booking); }}
                        disabled={verifying === booking.id}
                        className="rounded-xl"
                      >
                        {verifying === booking.id ? (
                          <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />Verifying</>
                        ) : (
                          <><ShieldCheck className="mr-1 h-3.5 w-3.5" />Verify PIN</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); navigate(`/booking/${booking.request_id}`); }}
                        className="text-xs"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                )}

                {/* Provider: Job started — show customer info & mark complete */}
                {showJobStarted && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex items-center gap-2 text-xs text-success font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Job in progress — Precise location revealed
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {booking.otherPartyName}
                      </span>
                      {req?.location_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {req.location_name}
                        </span>
                      )}
                      {booking.final_price_chf && (
                        <span className="font-medium">CHF {Number(booking.final_price_chf).toFixed(0)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleMarkComplete(booking); }}
                        disabled={completingId === booking.id}
                        className="rounded-xl"
                      >
                        {completingId === booking.id ? (
                          <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />Completing</>
                        ) : (
                          <><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Mark Complete</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); navigate(`/booking/${booking.request_id}`); }}
                        className="text-xs"
                      >
                        Full Details
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {bookings.length > 10 && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            {t("history.showingRecent", { count: 10, total: bookings.length })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
