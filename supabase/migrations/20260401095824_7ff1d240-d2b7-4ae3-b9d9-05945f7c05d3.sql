
DELETE FROM public.reviews WHERE reviewer_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931' OR reviewee_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
DELETE FROM public.transactions WHERE customer_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931' OR provider_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
DELETE FROM public.complaints WHERE reporter_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
DELETE FROM public.notifications WHERE user_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
DELETE FROM public.bookings WHERE customer_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931' OR provider_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
DELETE FROM public.bids WHERE provider_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
DELETE FROM public.service_requests WHERE customer_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
DELETE FROM public.platform_fees WHERE provider_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
DELETE FROM public.saved_payment_methods WHERE user_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
DELETE FROM public.providers WHERE user_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
DELETE FROM public.user_roles WHERE user_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
DELETE FROM public.profiles WHERE user_id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
DELETE FROM auth.users WHERE id = 'e1ec0f1e-d378-40d5-84d6-25ff61636931';
