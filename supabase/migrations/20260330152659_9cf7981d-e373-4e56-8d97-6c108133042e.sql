
-- Fix admin deadlock: prevent deletion of last admin
CREATE OR REPLACE FUNCTION public.prevent_last_admin_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_count integer;
BEGIN
  IF OLD.role = 'admin'::app_role THEN
    SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin'::app_role AND id != OLD.id;
    IF admin_count < 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin. At least one admin must exist.';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_last_admin_deletion
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_admin_deletion();

-- Add DELETE policy on notifications for users to clean up their own
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
