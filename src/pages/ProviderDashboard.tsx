import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, ChevronRight, Zap, User, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategoryById } from "@/lib/categories";
import { getCityFromCoords, getLocationNamesForCity } from "@/lib/locations";
import { BookingHistory } from "@/components/BookingHistory";
import { TransactionHistory } from "@/components/TransactionHistory";
import { ProviderPlatformFees } from "@/components/ProviderPlatformFees";
import type { ServiceRequest } from "@/lib/types";
import { RaiseTicket } from "@/components/RaiseTicket";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type Notification = {
  id: string;
  user_id: string;
  request_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
};

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<(ServiceRequest & { profiles: { display_name: string } | null })[]>([]);
  const [myBidRequestIds, setMyBidRequestIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
    loadNotifications();

    const channel = supabase
      .channel("provider-requests")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "service_requests" }, () => loadData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "service_requests" }, () => loadData())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => loadNotifications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).eq("read", false).order("created_at", { ascending: false }).limit(10);
    setNotifications((data as Notification[]) || []);
  };

  const dismissNotification = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const loadData = async () => {
    if (!user) return;

    // Fetch provider's service category and location to filter requests
    const { data: providerData } = await supabase
      .from("providers")
      .select("service_category, latitude, longitude")
      .eq("user_id", user.id)
      .maybeSingle();

    const myCategory = providerData?.service_category;

    // Fetch all open/bidding requests matching provider's category
    let reqQuery = supabase
      .from("service_requests")
      .select("*")
      .in("status", ["open", "bidding"])
      .order("created_at", { ascending: false });

    if (myCategory) {
      reqQuery = reqQuery.eq("category", myCategory);
    }

    const [{ data: reqs }, { data: bids }] = await Promise.all([
      reqQuery,
      supabase.from("bids").select("request_id").eq("provider_id", user.id),
    ]);

    // Client-side distance filter: show requests within 35km if provider has coords
    let filteredReqs = reqs || [];
    if (providerData?.latitude && providerData?.longitude) {
      const R = 6371;
      filteredReqs = filteredReqs.filter(r => {
        const dLat = (r.location_lat - providerData.latitude!) * Math.PI / 180;
        const dLng = (r.location_lng - providerData.longitude!) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(providerData.latitude! * Math.PI / 180) * Math.cos(r.location_lat * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2;
        const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return d <= 35;
      });
    }

    const rawReqs = filteredReqs;
    if (rawReqs.length > 0) {
      const customerIds = [...new Set(rawReqs.map(r => r.customer_id))];
      const { data: profiles } = await supabase.from("public_profiles").select("user_id, display_name").in("user_id", customerIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setRequests(rawReqs.map(r => ({ ...r, profiles: profileMap.get(r.customer_id) || null })));
    } else {
      setRequests([]);
    }
    setMyBidRequestIds(new Set((bids || []).map((b) => b.request_id)));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 className="font-heading text-2xl font-bold">{t("provider.availableRequests")}</h1>
        <p className="text-sm text-muted-foreground">{t("provider.subtitle")}</p>
      </div>

      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Bell className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm font-medium truncate">{notif.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => { dismissNotification(notif.id); navigate(`/request/${notif.request_id}`); }}
                  >
                    {t("provider.viewBid")}
                  </Button>
                  <button onClick={() => dismissNotification(notif.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {requests.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <Zap className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">{t("provider.noRequests")}</p>
            <p className="text-sm text-muted-foreground/70 mt-1">{t("provider.noRequestsSubtitle")}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {requests.map((req, i) => {
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
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{cat.emoji}</span>
                      <h3 className="font-heading font-semibold truncate">{req.title}</h3>
                      {myBidRequestIds.has(req.id) && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
                          {t("provider.bidSent")}
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-medium text-success shrink-0">
                        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
                        {req.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {req.profiles?.display_name || t("auth.customer")}
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
                  <ChevronRight className="h-5 w-5 text-muted-foreground/30 shrink-0 ml-2" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <BookingHistory role="provider" />
      <TransactionHistory role="provider" />
      <ProviderPlatformFees />

      <div className="flex justify-center">
        <RaiseTicket />
      </div>
    </motion.div>
  );
}
