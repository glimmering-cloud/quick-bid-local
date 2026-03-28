import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, CheckCircle2, ArrowLeft, PartyPopper, Star, Loader2 } from "lucide-react";
import { getCategoryById } from "@/lib/categories";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PageLoader } from "@/components/LoadingSkeleton";
import { ReviewForm } from "@/components/ReviewForm";
import { ComplaintForm } from "@/components/ComplaintForm";
import { toast } from "sonner";

export default function BookingConfirmation() {
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [existingReview, setExistingReview] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!requestId || !user) return;
    loadBooking();

    const channel = supabase
      .channel(`booking-${requestId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings", filter: `request_id=eq.${requestId}` }, () => loadBooking())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [requestId, user]);

  const loadBooking = async () => {
    const { data: bookingData } = await supabase.from("bookings").select("*").eq("request_id", requestId!).single();
    if (!bookingData) { setLoading(false); return; }

    const [{ data: request }, { data: bid }, { data: providerProfile }, { data: customerProfile }] = await Promise.all([
      supabase.from("service_requests").select("*").eq("id", bookingData.request_id).single(),
      supabase.from("bids").select("price, message").eq("id", bookingData.bid_id).single(),
      supabase.from("profiles").select("display_name, phone").eq("user_id", bookingData.provider_id).single(),
      supabase.from("profiles").select("display_name, phone").eq("user_id", bookingData.customer_id).single(),
    ]);

    setBooking({ ...bookingData, service_requests: request, bids: bid, provider: providerProfile, customer: customerProfile });

    if (user) {
      const { data: review } = await supabase.from("reviews").select("id").eq("booking_id", bookingData.id).eq("reviewer_id", user.id).maybeSingle();
      setExistingReview(!!review);
    }
    setLoading(false);
  };

  const handleMarkComplete = async () => {
    if (!booking) return;
    setCompleting(true);
    const { error } = await supabase.from("bookings").update({ status: "completed" as any }).eq("id", booking.id);
    if (error) {
      toast.error(error.message);
    } else {
      // Also update the service request status
      await supabase.from("service_requests").update({ status: "completed" as any }).eq("id", booking.request_id);
      toast.success(t("booking.markedComplete"));
    }
    setCompleting(false);
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    const { error } = await supabase.from("bookings").update({ status: "cancelled" as any }).eq("id", booking.id);
    if (error) {
      toast.error(error.message);
    } else {
      await supabase.from("service_requests").update({ status: "cancelled" as any }).eq("id", booking.request_id);
      toast.success(t("booking.cancelled"));
    }
  };

  if (loading) return <PageLoader />;

  if (!booking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t("booking.notFound")}</p>
        <Link to="/dashboard"><Button variant="ghost">{t("booking.goToDashboard")}</Button></Link>
      </div>
    );
  }

  const request = booking.service_requests;
  const isCustomer = booking.customer_id === user?.id;
  const isProvider = booking.provider_id === user?.id;
  const cat = getCategoryById(request?.category);

  const statusIcon = booking.status === "completed"
    ? { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: t("booking.completed") }
    : booking.status === "cancelled"
    ? { icon: CheckCircle2, color: "text-destructive", bg: "bg-destructive/10", label: t("booking.cancelledStatus") }
    : { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: t("booking.confirmed") };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link to={isCustomer ? "/dashboard" : "/provider"} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t("booking.backToDashboard")}
      </Link>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${statusIcon.bg}`}>
          <statusIcon.icon className={`h-8 w-8 ${statusIcon.color}`} />
        </motion.div>
        <h1 className="font-heading text-2xl font-bold">{statusIcon.label}</h1>
        {booking.status === "confirmed" && (
          <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
            <PartyPopper className="h-4 w-4" /> {t("booking.booked")}
          </p>
        )}
        {booking.status === "completed" && (
          <p className="text-muted-foreground mt-1">{t("booking.serviceComplete")}</p>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
        <Card className="shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              {[
                { label: t("booking.service"), value: <span className="font-medium flex items-center gap-1.5"><span>{cat.emoji}</span>{request.title}</span> },
                { label: t("booking.price"), value: <span className="font-heading text-xl font-bold text-primary">CHF {Number(booking.bids?.price || booking.final_price_chf || 0).toFixed(0)}</span> },
                { label: <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{t("booking.locationLabel")}</span>, value: <span className="font-medium">{request.location_name}</span> },
                { label: <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{t("booking.whenLabel")}</span>, value: <span className="font-medium">{format(new Date(request.requested_time), "EEE, MMM d 'at' HH:mm")}</span> },
                { label: <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{isCustomer ? t("booking.providerLabel") : t("booking.customerLabel")}</span>, value: <span className="font-medium">{isCustomer ? booking.provider?.display_name : booking.customer?.display_name}</span> },
                { label: t("booking.statusLabel"), value: (
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                    booking.status === "completed" ? "bg-success/10 text-success border-success/20" :
                    booking.status === "cancelled" ? "bg-destructive/10 text-destructive border-destructive/20" :
                    "bg-primary/10 text-primary border-primary/20"
                  }`}>
                    {booking.status}
                  </span>
                )},
              ].map((row, i) => (
                <div key={i}>
                  {i > 0 && <div className="h-px bg-border mb-3" />}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Provider: Mark as complete */}
      {isProvider && booking.status === "confirmed" && (
        <Card className="border-primary/20 shadow-sm">
          <CardContent className="p-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{t("booking.markCompleteDesc")}</p>
            <Button onClick={handleMarkComplete} disabled={completing} className="rounded-xl w-full">
              {completing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("booking.completing")}</>
              ) : (
                <><CheckCircle2 className="mr-2 h-4 w-4" />{t("booking.markComplete")}</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Customer: See completion status & cancel option */}
      {isCustomer && booking.status === "confirmed" && (
        <Card className="border-warning/20 shadow-sm">
          <CardContent className="p-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{t("booking.awaitingCompletion")}</p>
            <Button variant="outline" size="sm" onClick={handleCancelBooking} className="text-destructive border-destructive/30 hover:bg-destructive/5">
              {t("booking.cancelBooking")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews & complaints for completed bookings */}
      {booking.status === "completed" && (
        <div className="flex items-center justify-center gap-3">
          {!existingReview && (
            <ReviewForm bookingId={booking.id} revieweeId={isCustomer ? booking.provider_id : booking.customer_id} revieweeName={isCustomer ? booking.provider?.display_name : booking.customer?.display_name} onSubmitted={() => setExistingReview(true)} />
          )}
          {existingReview && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {t("booking.reviewSubmitted")}
            </div>
          )}
          <ComplaintForm bookingId={booking.id} reportedUserId={isCustomer ? booking.provider_id : booking.customer_id} />
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">{t("booking.confirmationSent")}</p>
    </div>
  );
}
