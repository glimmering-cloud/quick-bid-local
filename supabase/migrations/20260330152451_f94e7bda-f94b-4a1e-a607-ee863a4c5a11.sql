
-- 1. Replace the overly broad "Booking parties can read profiles" policy
-- with one that only exposes display_name and avatar_url (not phone/GPS)
-- We do this by dropping the old policy and creating a restricted view approach.
DROP POLICY IF EXISTS "Booking parties can read profiles" ON public.profiles;

-- Create a new policy that only allows booking parties to read non-sensitive columns
-- Since RLS is row-level, we use a security-definer function + view for column restriction.
-- Instead, we'll create a function that booking parties call to get safe profile data.

-- 2. Add job verification columns to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS job_started boolean NOT NULL DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS job_started_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS verification_pin text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address_revealed boolean NOT NULL DEFAULT false;

-- 3. Create a safe profile lookup function for booking parties
CREATE OR REPLACE FUNCTION public.get_booking_counterparty(p_booking_id uuid)
RETURNS TABLE(display_name text, avatar_url text, masked_phone text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_booking record;
  v_counterparty_id uuid;
  v_profile record;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Determine counterparty
  IF v_booking.customer_id = auth.uid() THEN
    v_counterparty_id := v_booking.provider_id;
  ELSIF v_booking.provider_id = auth.uid() THEN
    v_counterparty_id := v_booking.customer_id;
  ELSE
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT p.display_name, p.avatar_url, p.phone
  INTO v_profile
  FROM public.profiles p
  WHERE p.user_id = v_counterparty_id;

  -- Mask phone: show only last 4 digits
  RETURN QUERY SELECT
    v_profile.display_name,
    v_profile.avatar_url,
    CASE
      WHEN v_profile.phone IS NOT NULL AND length(v_profile.phone) > 4
      THEN regexp_replace(v_profile.phone, '.(?=.{4})', '*', 'g')
      ELSE v_profile.phone
    END AS masked_phone;
END;
$$;

-- 4. Create a function to get booking location (approximate vs precise)
CREATE OR REPLACE FUNCTION public.get_booking_location(p_booking_id uuid)
RETURNS TABLE(location_name text, location_lat double precision, location_lng double precision, is_precise boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_booking record;
  v_request record;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  IF v_booking.customer_id != auth.uid() AND v_booking.provider_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_request FROM public.service_requests WHERE id = v_booking.request_id;

  -- Customer always sees precise location
  IF v_booking.customer_id = auth.uid() THEN
    RETURN QUERY SELECT v_request.location_name, v_request.location_lat, v_request.location_lng, true;
    RETURN;
  END IF;

  -- Provider sees precise only after job_started
  IF v_booking.job_started THEN
    RETURN QUERY SELECT v_request.location_name, v_request.location_lat, v_request.location_lng, true;
  ELSE
    -- Round to ~500m precision
    RETURN QUERY SELECT
      split_part(v_request.location_name, ',', 1) || ' area'::text,
      round(v_request.location_lat::numeric, 2)::double precision,
      round(v_request.location_lng::numeric, 2)::double precision,
      false;
  END IF;
END;
$$;

-- 5. Generate verification PIN on booking creation via trigger
CREATE OR REPLACE FUNCTION public.generate_booking_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.verification_pin := lpad(floor(random() * 10000)::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_booking_pin
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_booking_pin();

-- 6. Update provider booking update policy to allow setting job_started
DROP POLICY IF EXISTS "Provider can complete booking" ON public.bookings;

CREATE POLICY "Provider can complete booking"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = provider_id AND status = 'confirmed'::booking_status)
WITH CHECK (auth.uid() = provider_id AND status IN ('completed'::booking_status, 'confirmed'::booking_status));
