-- Add free trial tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN free_trial_start DATE DEFAULT CURRENT_DATE,
ADD COLUMN free_trial_active BOOLEAN DEFAULT TRUE;

-- Create function to check if user's free trial is still active
CREATE OR REPLACE FUNCTION public.is_free_trial_active(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  trial_start DATE;
  trial_active BOOLEAN;
  days_since_start INTEGER;
BEGIN
  SELECT free_trial_start, free_trial_active 
  INTO trial_start, trial_active
  FROM public.profiles 
  WHERE user_id = user_id_param;
  
  -- If no profile found, return false
  IF trial_start IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate days since trial start
  days_since_start := CURRENT_DATE - trial_start;
  
  -- Trial is active if less than 14 days have passed
  IF days_since_start < 14 THEN
    -- Update trial status if it changed
    IF NOT trial_active THEN
      UPDATE public.profiles 
      SET free_trial_active = TRUE 
      WHERE user_id = user_id_param;
    END IF;
    RETURN TRUE;
  ELSE
    -- Update trial status if it changed
    IF trial_active THEN
      UPDATE public.profiles 
      SET free_trial_active = FALSE 
      WHERE user_id = user_id_param;
    END IF;
    RETURN FALSE;
  END IF;
END;
$$;

-- Create function to get user's account access level
CREATE OR REPLACE FUNCTION public.get_user_access_level(user_id_param UUID)
RETURNS TABLE(
  account_type TEXT,
  has_subscription BOOLEAN,
  free_trial_active BOOLEAN,
  free_trial_days_remaining INTEGER,
  can_access_app BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  profile_account_type TEXT;
  subscription_active BOOLEAN := FALSE;
  trial_active BOOLEAN;
  trial_start DATE;
  days_remaining INTEGER;
BEGIN
  -- Get profile info
  SELECT p.account_type::TEXT, p.free_trial_start
  INTO profile_account_type, trial_start
  FROM public.profiles p
  WHERE p.user_id = user_id_param;
  
  -- Check subscription status
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
    (subscription_active OR trial_active) as can_access_app;
END;
$$;

-- Create function to check flight limits for current month
CREATE OR REPLACE FUNCTION public.get_user_flight_count_this_month(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  flight_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO flight_count
  FROM public.flights f
  WHERE f.user_id = user_id_param
    AND EXTRACT(YEAR FROM f.flight_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM f.flight_date) = EXTRACT(MONTH FROM CURRENT_DATE);
  
  RETURN COALESCE(flight_count, 0);
END;
$$;

-- Create function to get user's aircraft count
CREATE OR REPLACE FUNCTION public.get_user_aircraft_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  aircraft_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO aircraft_count
  FROM public.aircraft a
  WHERE a.user_id = user_id_param;
  
  RETURN COALESCE(aircraft_count, 0);
END;
$$;