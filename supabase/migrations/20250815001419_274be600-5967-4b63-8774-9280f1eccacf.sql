-- Fix the admin_override_subscription function to properly cast account_type
CREATE OR REPLACE FUNCTION public.admin_override_subscription(target_user_id uuid, new_account_type text, subscription_active boolean, admin_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  admin_account_type TEXT;
BEGIN
  -- Check if the caller is a Super Admin
  SELECT account_type::TEXT INTO admin_account_type
  FROM public.profiles 
  WHERE user_id = admin_user_id;
  
  IF admin_account_type != 'Super Admin' THEN
    RAISE EXCEPTION 'Access denied. Super Admin required.';
  END IF;
  
  -- Update the target user's profile account type
  UPDATE public.profiles 
  SET account_type = new_account_type::account_type
  WHERE user_id = target_user_id;
  
  -- Update or insert subscription record
  INSERT INTO public.subscribers (
    user_id, 
    email, 
    subscribed, 
    account_type,
    subscription_end,
    updated_at
  )
  SELECT 
    target_user_id,
    au.email,
    subscription_active,
    new_account_type::account_type,  -- Cast to enum type
    CASE 
      WHEN subscription_active THEN (CURRENT_DATE + INTERVAL '1 year')::timestamptz
      ELSE NULL
    END,
    now()
  FROM auth.users au
  WHERE au.id = target_user_id
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    subscribed = subscription_active,
    account_type = new_account_type::account_type,  -- Cast to enum type
    subscription_end = CASE 
      WHEN subscription_active THEN (CURRENT_DATE + INTERVAL '1 year')::timestamptz
      ELSE NULL
    END,
    updated_at = now();
    
  RETURN TRUE;
END;
$$;