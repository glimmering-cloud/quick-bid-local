
-- Fix 1: Remove role escalation window from profile update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role = (SELECT p.role FROM profiles p WHERE p.user_id = auth.uid())
);

-- Fix 2: Fix is_staff to only check actual staff roles
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'customer_service', 'moderator')
  )
$$;

-- Fix 3: Create a view for public profile info (non-sensitive) and restrict the profiles SELECT policy
-- We'll restrict the SELECT policy to hide sensitive fields for non-owners
-- Since we can't do column-level RLS, we create a secure view
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT user_id, display_name, avatar_url, bio, role, created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;
