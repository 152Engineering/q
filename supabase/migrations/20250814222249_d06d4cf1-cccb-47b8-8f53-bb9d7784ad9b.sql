-- Add country code columns to flights table
ALTER TABLE public.flights 
ADD COLUMN departure_country_code text,
ADD COLUMN arrival_country_code text;