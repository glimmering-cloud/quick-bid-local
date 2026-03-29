
-- Fix 1: Restrict profiles SELECT to owner, booking parties, and staff
DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Booking parties can read profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE (bookings.customer_id = auth.uid() AND bookings.provider_id = profiles.user_id)
         OR (bookings.provider_id = auth.uid() AND bookings.customer_id = profiles.user_id)
    )
  );

CREATE POLICY "Staff can read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- Fix 2: Add CHECK constraint on notifications type
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('new_request', 'bid_received', 'bid_accepted', 'bid_rejected', 'booking_confirmed', 'booking_completed', 'booking_cancelled'));
