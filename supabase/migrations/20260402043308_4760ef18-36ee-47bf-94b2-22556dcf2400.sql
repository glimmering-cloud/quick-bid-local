
-- Create provider wallets table
CREATE TABLE public.provider_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  total_platform_fees NUMERIC NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_wallets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Providers can view own wallet"
ON public.provider_wallets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Providers can update own wallet"
ON public.provider_wallets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can insert own wallet"
ON public.provider_wallets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_provider_wallets_updated_at
BEFORE UPDATE ON public.provider_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
