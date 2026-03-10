
-- Add providers table for business-specific info
CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL,
  service_category text NOT NULL DEFAULT 'haircut',
  latitude double precision,
  longitude double precision,
  rating numeric DEFAULT 0,
  base_price_chf numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers viewable by everyone" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers can insert own record" ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers can update own record" ON public.providers FOR UPDATE USING (auth.uid() = user_id);

-- Add missing columns to service_requests
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS radius_km numeric DEFAULT 5;

-- Add missing columns to bids
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS estimated_wait_minutes integer;

-- Add missing columns to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS final_price_chf numeric;

-- Geolocation indexes for fast spatial queries
CREATE INDEX idx_providers_geo ON public.providers (latitude, longitude);
CREATE INDEX idx_service_requests_geo ON public.service_requests (location_lat, location_lng);
CREATE INDEX idx_profiles_geo ON public.profiles (location_lat, location_lng);

-- Status indexes for common filters
CREATE INDEX idx_service_requests_status ON public.service_requests (status);
CREATE INDEX idx_bids_request_id ON public.bids (request_id);
CREATE INDEX idx_bids_provider_id ON public.bids (provider_id);
CREATE INDEX idx_bookings_request_id ON public.bookings (request_id);

-- Updated_at trigger for providers
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for providers
ALTER PUBLICATION supabase_realtime ADD TABLE public.providers;
