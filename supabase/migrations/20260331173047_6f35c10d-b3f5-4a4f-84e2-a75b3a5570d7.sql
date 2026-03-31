CREATE OR REPLACE FUNCTION public.find_matching_providers(req_lat double precision, req_lng double precision, req_category text, radius_km double precision DEFAULT 35.0)
 RETURNS TABLE(provider_user_id uuid, business_name text, distance_km double precision)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT
    p.user_id AS provider_user_id,
    p.business_name,
    (6371 * acos(
      cos(radians(req_lat)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(req_lng)) +
      sin(radians(req_lat)) * sin(radians(p.latitude))
    )) AS distance_km
  FROM public.providers p
  WHERE p.service_category = req_category
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (6371 * acos(
      cos(radians(req_lat)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(req_lng)) +
      sin(radians(req_lat)) * sin(radians(p.latitude))
    )) <= radius_km
  ORDER BY distance_km ASC;
$$;