-- Update get_all_users_for_admin to include admin override detection
DROP FUNCTION IF EXISTS public.get_all_users_for_admin(uuid);

CREATE OR REPLACE FUNCTION public.get_all_users_for_admin(admin_user_id uuid)
 RETURNS TABLE(user_id uuid, email text, first_name text, last_name text, account_type text, subscribed boolean, subscription_end timestamp with time zone, free_trial_days_remaining integer, has_admin_override boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
    au.email::TEXT,
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
    END as free_trial_days_remaining,
    -- Admin override = subscribed but no stripe customer
    CASE 
      WHEN COALESCE(s.subscribed, FALSE) = TRUE AND s.stripe_customer_id IS NULL THEN TRUE
      ELSE FALSE
    END as has_admin_override
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.subscribers s ON s.user_id = p.user_id
  WHERE au.email IS NOT NULL
  ORDER BY p.first_name, p.last_name;
END;
$$;