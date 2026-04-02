
ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'new_request'::text, 'bid_received'::text, 'bid_accepted'::text,
    'bid_rejected'::text, 'booking_confirmed'::text, 'booking_completed'::text,
    'booking_cancelled'::text, 'payment_received'::text, 'payout_sent'::text
  ])
);
