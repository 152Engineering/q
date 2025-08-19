-- Update the get_user_access_level function to handle Super Admin privileges
CREATE OR REPLACE FUNCTION public.get_user_access_level(user_id_param UUID)
RETURNS TABLE(
  account_type TEXT,
  has_subscription BOOLEAN,
  free_trial_active BOOLEAN,
  free_trial_days_remaining INTEGER,
  can_access_app BOOLEAN,
  is_super_admin BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_account_type TEXT;
  subscription_active BOOLEAN := FALSE;
  trial_active BOOLEAN;
  trial_start DATE;
  days_remaining INTEGER;
  super_admin_status BOOLEAN := FALSE;
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
      TRUE as is_super_admin;
    RETURN;
  END IF;
  
  -- Check subscription status for non-Super Admins
  SELECT COALESCE(s.subscribed, FALSE)
  INTO subscription_active
  FROM public.subscribers s
  WHERE s.user_id = user_id_param;
  
  -- Check trial status
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
    FALSE as is_super_admin;
END;
$$;

-- Create function for Super Admin to override user subscription
CREATE OR REPLACE FUNCTION public.admin_override_subscription(
  target_user_id UUID,
  new_account_type TEXT,
  subscription_active BOOLEAN,
  admin_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    new_account_type,
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
    account_type = new_account_type,
    subscription_end = CASE 
      WHEN subscription_active THEN (CURRENT_DATE + INTERVAL '1 year')::timestamptz
      ELSE NULL
    END,
    updated_at = now();
    
  RETURN TRUE;
END;
$$;

-- Create function to get all users for admin management
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin(admin_user_id UUID)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  account_type TEXT,
  subscribed BOOLEAN,
  subscription_end TIMESTAMPTZ,
  free_trial_days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if the caller is a Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = admin_user_id 
    AND profiles.account_type = 'Super Admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Super Admin required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    au.email,
    p.first_name,
    p.last_name,
    p.account_type::TEXT,
    COALESCE(s.subscribed, FALSE) as subscribed,
    s.subscription_end,
    CASE 
      WHEN p.free_trial_start IS NOT NULL THEN
        GREATEST(0, 14 - (CURRENT_DATE - p.free_trial_start))
      ELSE 0
    END as free_trial_days_remaining
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.subscribers s ON s.user_id = p.user_id
  WHERE au.email IS NOT NULL
  ORDER BY p.first_name, p.last_name;
END;
$$;