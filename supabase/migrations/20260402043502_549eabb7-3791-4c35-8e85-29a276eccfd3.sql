
-- Drop existing insert/update policies
DROP POLICY "Providers can update own wallet" ON public.provider_wallets;
DROP POLICY "Providers can insert own wallet" ON public.provider_wallets;

-- Allow authenticated users to insert (customer credits provider during payment)
CREATE POLICY "Authenticated can insert wallet"
ON public.provider_wallets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update (customer credits provider during payment)
CREATE POLICY "Authenticated can update wallet"
ON public.provider_wallets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
