-- Create a function to completely delete a user and all their data
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid, admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_account_type TEXT;
  target_account_type TEXT;
BEGIN
  -- Check if the caller is a Super Admin
  SELECT account_type::TEXT INTO admin_account_type
  FROM public.profiles 
  WHERE user_id = admin_user_id;
  
  IF admin_account_type != 'Super Admin' THEN
    RAISE EXCEPTION 'Access denied. Super Admin required.';
  END IF;
  
  -- Check if target user is also a Super Admin (prevent deletion)
  SELECT account_type::TEXT INTO target_account_type
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  IF target_account_type = 'Super Admin' THEN
    RAISE EXCEPTION 'Cannot delete Super Admin users.';
  END IF;
  
  -- Delete user data in the correct order (respecting foreign key constraints)
  
  -- Delete flight crew records
  DELETE FROM public.flight_crew 
  WHERE flight_id IN (
    SELECT id FROM public.flights WHERE user_id = target_user_id
  );
  
  -- Delete flights
  DELETE FROM public.flights WHERE user_id = target_user_id;
  
  -- Delete aircraft
  DELETE FROM public.aircraft WHERE user_id = target_user_id;
  
  -- Delete crew
  DELETE FROM public.crew WHERE user_id = target_user_id;
  
  -- Delete reminders
  DELETE FROM public.reminders WHERE user_id = target_user_id;
  
  -- Delete subscribers record
  DELETE FROM public.subscribers WHERE user_id = target_user_id;
  
  -- Delete profile (this should be last for user data)
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  -- Finally delete from auth.users (this will cascade to any remaining references)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$function$;