import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, CheckCircle2, ArrowLeft, PartyPopper, Star } from "lucide-react";
import { getCategoryById } from "@/lib/categories";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PageLoader } from "@/components/LoadingSkeleton";
import { ReviewForm } from "@/components/ReviewForm";
import { ComplaintForm } from "@/components/ComplaintForm";

export default function BookingConfirmation() {
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [existingReview, setExistingReview] = useState(false);

  useEffect(() => {
    if (!requestId || !user) return;
    loadBooking();
  }, [requestId, user]);

  const loadBooking = async () => {
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("*")
      .eq("request_id", requestId!)
      .single();

    if (!bookingData) { setLoading(false); return; }

    const [{ data: request }, { data: bid }, { data: providerProfile }, { data: customerProfile }] = await Promise.all([
      supabase.from("service_requests").select("*").eq("id", bookingData.request_id).single(),
      supabase.from("bids").select("price, message").eq("id", bookingData.bid_id).single(),
      supabase.from("profiles").select("display_name, phone").eq("user_id", bookingData.provider_id).single(),
      supabase.from("profiles").select("display_name, phone").eq("user_id", bookingData.customer_id).single(),
    ]);

    setBooking({
      ...bookingData,
      service_requests: request,
      bids: bid,
      provider: providerProfile,
      customer: customerProfile,
    });
    setLoading(false);
  };

  if (loading) return <PageLoader />;

  if (!booking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Booking not found</p>
        <Link to="/dashboard"><Button variant="ghost">Go to Dashboard</Button></Link>
      </div>
    );
  }

  const request = booking.service_requests;
  const isCustomer = booking.customer_id === user?.id;
  const cat = getCategoryById(request?.category);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link to={isCustomer ? "/dashboard" : "/provider"} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10"
        >
          <CheckCircle2 className="h-8 w-8 text-success" />
        </motion.div>
        <h1 className="font-heading text-2xl font-bold">Booking Confirmed!</h1>
        <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
          <PartyPopper className="h-4 w-4" /> Your appointment has been booked
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              {[
                {
                  label: "Service",
                  value: (
                    <span className="font-medium flex items-center gap-1.5">
                      <span>{cat.emoji}</span>
                      {request.title}
                    </span>
                  ),
                },
                {
                  label: "Price",
                  value: (
                    <span className="font-heading text-xl font-bold text-primary">
                      CHF {Number(booking.bids?.price || booking.final_price_chf || 0).toFixed(0)}
                    </span>
                  ),
                },
                {
                  label: (
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />Location</span>
                  ),
                  value: <span className="font-medium">{request.location_name}</span>,
                },
                {
                  label: (
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />When</span>
                  ),
                  value: <span className="font-medium">{format(new Date(request.requested_time), "EEE, MMM d 'at' HH:mm")}</span>,
                },
                {
                  label: (
                    <span className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      {isCustomer ? "Provider" : "Customer"}
                    </span>
                  ),
                  value: (
                    <span className="font-medium">
                      {isCustomer ? booking.provider?.display_name : booking.customer?.display_name}
                    </span>
                  ),
                },
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

      <p className="text-center text-sm text-muted-foreground">
        A confirmation has been sent to both parties.
      </p>
    </div>
  );
}
