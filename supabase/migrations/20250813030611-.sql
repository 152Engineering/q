-- Add volume and weight unit preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN volume_unit text DEFAULT 'Liters' CHECK (volume_unit IN ('Liters', 'Gallons')),
ADD COLUMN weight_unit text DEFAULT 'Kgs' CHECK (weight_unit IN ('Lbs', 'Kgs'));