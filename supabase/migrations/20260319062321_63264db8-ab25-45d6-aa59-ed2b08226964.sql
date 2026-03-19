-- 1. Create app_role enum for management roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer_service', 'moderator');

-- 2. Create user_roles table (separate from profiles per security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: check if user has any management role
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- 4. RLS for user_roles
CREATE POLICY "Staff can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Complaint status enum
CREATE TYPE public.complaint_status AS ENUM ('open', 'in_progress', 'resolved', 'dismissed');

-- 6. Complaint category enum
CREATE TYPE public.complaint_category AS ENUM ('service_quality', 'payment_dispute', 'no_show', 'inappropriate_behavior');

-- 7. Complaints table
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  reported_user_id UUID,
  booking_id UUID REFERENCES public.bookings(id),
  category complaint_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'open',
  assigned_to UUID,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Users can view their own complaints
CREATE POLICY "Users can view own complaints"
  ON public.complaints FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);

-- Staff can view all complaints
CREATE POLICY "Staff can view all complaints"
  ON public.complaints FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- Users can create complaints
CREATE POLICY "Users can create complaints"
  ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Staff can update complaints (assign, resolve, etc.)
CREATE POLICY "Staff can update complaints"
  ON public.complaints FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- 8. Reviews table (two-way)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) NOT NULL,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, reviewer_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view reviews
CREATE POLICY "Authenticated can view reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (true);

-- Users can create reviews for their own bookings
CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND auth.uid() != reviewee_id
    AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = reviews.booking_id
      AND status = 'completed'
      AND (customer_id = auth.uid() OR provider_id = auth.uid())
    )
  );

-- Moderators can delete reviews
CREATE POLICY "Moderators can delete reviews"
  ON public.reviews FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on complaints
CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();