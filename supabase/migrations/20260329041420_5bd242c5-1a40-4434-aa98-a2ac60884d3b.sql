
-- Add provider_type to providers table
ALTER TABLE public.providers 
  ADD COLUMN IF NOT EXISTS provider_type text NOT NULL DEFAULT 'company' 
  CHECK (provider_type IN ('company', 'agency', 'individual'));
