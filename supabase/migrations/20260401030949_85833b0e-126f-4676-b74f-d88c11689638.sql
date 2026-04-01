
CREATE TABLE public.platform_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  period_month text NOT NULL, -- e.g. '2026-04'
  total_earnings numeric NOT NULL DEFAULT 0,
  fee_pct numeric NOT NULL DEFAULT 2.0,
  fee_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  payment_ref text,
  payment_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, period_month)
);

ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own platform fees"
  ON public.platform_fees FOR SELECT TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can update own pending fees"
  ON public.platform_fees FOR UPDATE TO authenticated
  USING (auth.uid() = provider_id AND status = 'pending')
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Staff can view all platform fees"
  ON public.platform_fees FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));

-- Allow insert from edge functions / service role, and also for provider to self-generate
CREATE POLICY "Authenticated can insert own platform fees"
  ON public.platform_fees FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = provider_id);
