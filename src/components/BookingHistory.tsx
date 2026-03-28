import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategoryById } from "@/lib/categories";
import { format } from "date-fns";
import { History, MapPin, Clock, Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface BookingHistoryProps {
  role: "customer" | "provider";
}

export function BookingHistory({ role }: BookingHistoryProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        supabase.from("profiles").select("user_id, display_name").in("user_id", otherUserIds),
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
          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/booking/${booking.request_id}`)}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {cat && <span>{cat.emoji}</span>}
                    <span className="font-medium text-sm truncate">{req?.title || "Booking"}</span>
                    <Badge variant="outline" className={`text-xs ${statusColor(booking.status)}`}>
                      {booking.status}
                    </Badge>
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
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
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
