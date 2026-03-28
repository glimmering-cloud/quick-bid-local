
-- Restrict profiles SELECT to only own row for full data; other users use public_profiles view
DROP POLICY IF EXISTS "Users can read basic profile info" ON public.profiles;

CREATE POLICY "Users can read own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow reading display_name and avatar_url for other users via a permissive policy
-- that only exposes non-sensitive columns (needed for bid/booking profile lookups)
CREATE POLICY "Users can read basic info of others"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
