-- Drop the existing function and recreate with correct type
DROP FUNCTION IF EXISTS public.get_user_emails_for_admin();

CREATE OR REPLACE FUNCTION public.get_user_emails_for_admin()
RETURNS TABLE (
  user_id uuid,
  email character varying(255)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only allow Super Admin to call this function
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Super Admin required.';
  END IF;

  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email
  FROM auth.users au
  WHERE au.email IS NOT NULL;
END;
$$;