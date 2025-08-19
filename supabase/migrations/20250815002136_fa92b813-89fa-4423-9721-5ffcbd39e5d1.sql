-- Drop and recreate get_user_access_level function with admin override detection
DROP FUNCTION IF EXISTS public.get_user_access_level(uuid);

CREATE OR REPLACE FUNCTION public.get_user_access_level(user_id_param uuid)
 RETURNS TABLE(account_type text, has_subscription boolean, free_trial_active boolean, free_trial_days_remaining integer, can_access_app boolean, is_super_admin boolean, has_admin_override boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  profile_account_type TEXT;
  subscription_active BOOLEAN := FALSE;
  trial_active BOOLEAN;
  trial_start DATE;
  days_remaining INTEGER;
  super_admin_status BOOLEAN := FALSE;
  admin_override_status BOOLEAN := FALSE;
  stripe_customer_exists BOOLEAN := FALSE;
BEGIN
  -- Get profile info and check if user is Super Admin
  SELECT p.account_type::TEXT, p.free_trial_start, 
         (p.account_type::TEXT = 'Super Admin')
  INTO profile_account_type, trial_start, super_admin_status
  FROM public.profiles p
  WHERE p.user_id = user_id_param;
  
  -- Super Admins bypass all restrictions
  IF super_admin_status THEN
    RETURN QUERY SELECT 
      profile_account_type,
      TRUE as has_subscription,
      TRUE as free_trial_active,
      999 as free_trial_days_remaining,
      TRUE as can_access_app,
      TRUE as is_super_admin,
      FALSE as has_admin_override;
    RETURN;
  END IF;
  
  -- Check subscription status and detect admin override
  SELECT COALESCE(s.subscribed, FALSE), COALESCE(s.stripe_customer_id IS NOT NULL, FALSE)
  INTO subscription_active, stripe_customer_exists
  FROM public.subscribers s
  WHERE s.user_id = user_id_param;
  
  -- Admin override = subscribed but no stripe customer
  admin_override_status := subscription_active AND NOT stripe_customer_exists;
  
  -- Users with admin override bypass trial restrictions
  IF admin_override_status THEN
    RETURN QUERY SELECT 
      profile_account_type,
      TRUE as has_subscription,
      FALSE as free_trial_active,  -- No trial needed
      0 as free_trial_days_remaining,  -- No trial days
      TRUE as can_access_app,
      FALSE as is_super_admin,
      TRUE as has_admin_override;
    RETURN;
  END IF;
  
  -- Check trial status for regular users
  trial_active := public.is_free_trial_active(user_id_param);
  
  -- Calculate days remaining
  IF trial_start IS NOT NULL THEN
    days_remaining := 14 - (CURRENT_DATE - trial_start);
    days_remaining := GREATEST(0, days_remaining);
  ELSE
    days_remaining := 0;
  END IF;
  
  -- Determine if user can access app
  -- Can access if: has subscription OR trial is still active
  RETURN QUERY SELECT 
    profile_account_type,
    subscription_active,
    trial_active,
    days_remaining,
    (subscription_active OR trial_active) as can_access_app,
    FALSE as is_super_admin,
    FALSE as has_admin_override;
END;
$$;