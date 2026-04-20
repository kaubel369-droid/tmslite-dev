-- Update the customer_portal_loads view to be a security invoker view
-- This resolves the "View public.customer_portal_loads is defined with the SECURITY DEFINER property" security warning.

ALTER VIEW public.customer_portal_loads SET (security_invoker = true);
