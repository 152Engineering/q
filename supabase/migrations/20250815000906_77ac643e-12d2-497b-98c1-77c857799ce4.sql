-- Remove default values for profile fields that should be NULL on account creation
ALTER TABLE public.profiles 
  ALTER COLUMN timezone DROP DEFAULT,
  ALTER COLUMN date_format DROP DEFAULT,
  ALTER COLUMN currency DROP DEFAULT,
  ALTER COLUMN pilot_license DROP DEFAULT;