DROP POLICY IF EXISTS "Providers and owners can view requests" ON public.service_requests;

CREATE POLICY "Providers and owners can view requests"
ON public.service_requests
FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR (
    EXISTS (
      SELECT 1
      FROM public.providers
      WHERE providers.user_id = auth.uid()
    )
    AND (
      status = ANY (ARRAY['open'::public.request_status, 'bidding'::public.request_status])
      OR EXISTS (
        SELECT 1
        FROM public.bookings
        WHERE bookings.request_id = service_requests.id
          AND bookings.provider_id = auth.uid()
      )
    )
  )
);