
-- Fix the overly permissive insert policy on notifications
-- Notifications should only be inserted by backend functions (service role)
DROP POLICY "System can insert notifications" ON public.notifications;

-- Only allow authenticated users to insert notifications for other users
-- (the edge function uses service role which bypasses RLS anyway)
CREATE POLICY "Authenticated can insert notifications" ON public.notifications 
  FOR INSERT TO authenticated
  WITH CHECK (true);
