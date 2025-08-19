-- Add theme preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system'));