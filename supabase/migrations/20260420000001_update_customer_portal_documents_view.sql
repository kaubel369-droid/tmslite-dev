-- Update the customer_portal_documents view to be a security invoker view
-- This resolves the "View public.customer_portal_documents is defined with the SECURITY DEFINER property" security warning.

ALTER VIEW public.customer_portal_documents SET (security_invoker = true);
