import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, CheckCircle2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function BookingConfirmation() {
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId || !user) return;
    loadBooking();
  }, [requestId, user]);

  const loadBooking = async () => {
    const { data } = await supabase
      .from("bookings")
      .select(`
        *,
        service_requests (*),
        bids (price, message),
        provider:profiles!bookings_provider_id_fkey (display_name, phone),
        customer:profiles!bookings_customer_id_fkey (display_name, phone)
      `)
      .eq("request_id", requestId!)
      .single();

    setBooking(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link to={isCustomer ? "/dashboard" : "/provider"} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="text-center animate-fade-in-up">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h1 className="font-heading text-2xl font-bold">Booking Confirmed!</h1>
        <p className="text-muted-foreground mt-1">Your appointment has been booked</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Service</span>
              <span className="font-medium">{request.title}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="font-heading text-xl font-bold text-primary">
                CHF {Number(booking.bids?.price || 0).toFixed(0)}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />Location
              </span>
              <span className="font-medium">{request.location_name}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4" />When
              </span>
              <span className="font-medium">{format(new Date(request.requested_time), "EEE, MMM d 'at' HH:mm")}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {isCustomer ? "Barber" : "Customer"}
              </span>
              <span className="font-medium">
                {isCustomer ? booking.provider?.display_name : booking.customer?.display_name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>A confirmation has been sent to both parties.</p>
      </div>
    </div>
  );
}
