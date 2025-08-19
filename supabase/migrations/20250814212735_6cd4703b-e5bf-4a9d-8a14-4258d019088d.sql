-- Fix the function to match the actual email column type
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