-- Fix the get_all_users_for_admin function to properly handle trial logic
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
    au.email::TEXT, -- Cast to TEXT to match return type
    p.first_name,
    p.last_name,
    p.account_type::TEXT,
    COALESCE(s.subscribed, FALSE) as subscribed,
    s.subscription_end,
    CASE 
      -- Super Admins don't have trial limitations
      WHEN p.account_type::TEXT = 'Super Admin' THEN 0
      -- Users with active subscriptions don't need trial info
      WHEN COALESCE(s.subscribed, FALSE) = TRUE THEN 0
      -- Calculate trial days for free users only
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