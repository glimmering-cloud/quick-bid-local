
-- Create a notifications table for matched providers
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'new_request',
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON public.notifications (user_id, read);
CREATE INDEX idx_notifications_request ON public.notifications (request_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Database function: find providers within radius, filtered by category
CREATE OR REPLACE FUNCTION public.find_matching_providers(
  req_lat double precision,
  req_lng double precision,
  req_category text,
  radius_km double precision DEFAULT 2.0
)
RETURNS TABLE(
  provider_user_id uuid,
  business_name text,
  distance_km double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id AS provider_user_id,
    p.business_name,
    (6371 * acos(
      cos(radians(req_lat)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(req_lng)) +
      sin(radians(req_lat)) * sin(radians(p.latitude))
    )) AS distance_km
  FROM public.providers p
  WHERE p.service_category = req_category
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (6371 * acos(
      cos(radians(req_lat)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(req_lng)) +
      sin(radians(req_lat)) * sin(radians(p.latitude))
    )) <= radius_km
  ORDER BY distance_km ASC;
$$;
