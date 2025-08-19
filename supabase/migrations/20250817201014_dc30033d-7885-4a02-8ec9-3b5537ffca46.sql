-- Fix security warning by setting search_path on the CMS function
CREATE OR REPLACE FUNCTION public.update_cms_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;