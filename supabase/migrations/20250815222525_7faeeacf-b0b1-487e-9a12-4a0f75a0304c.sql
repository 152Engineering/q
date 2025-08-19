-- Add hobbs and tacho tracking flag to aircraft table
ALTER TABLE public.aircraft 
ADD COLUMN track_hobbs_tacho boolean NOT NULL DEFAULT false;