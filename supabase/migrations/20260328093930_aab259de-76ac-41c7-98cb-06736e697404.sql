
-- The two permissive policies both grant full SELECT; consolidate back to one
-- but ensure phone is queried only for own profile in code (code-level fix)
DROP POLICY IF EXISTS "Users can read own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read basic info of others" ON public.profiles;

CREATE POLICY "Users can read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
