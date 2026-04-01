
-- Transactions table to record all payment activity
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  request_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  
  -- Amounts
  service_amount numeric NOT NULL,
  convenience_fee_pct numeric NOT NULL DEFAULT 2.0,
  convenience_fee numeric NOT NULL,
  bank_charges numeric NOT NULL DEFAULT 0,
  total_charged numeric NOT NULL,
  provider_payout numeric NOT NULL,
  
  -- Metadata
  transaction_ref text NOT NULL,
  payment_method text NOT NULL DEFAULT 'card',
  status text NOT NULL DEFAULT 'completed',
  currency text NOT NULL DEFAULT 'CHF',
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Customers can see their own transactions
CREATE POLICY "Customers can view own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

-- Providers can see their own transactions
CREATE POLICY "Providers can view own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = provider_id);

-- Authenticated users can insert (during payment flow)
CREATE POLICY "Authenticated can insert transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

-- Staff can view all
CREATE POLICY "Staff can view all transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));
