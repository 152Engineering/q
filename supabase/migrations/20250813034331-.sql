-- Add fuel tank capacity and average fuel burn fields to aircraft table
ALTER TABLE public.aircraft 
ADD COLUMN fuel_tank_capacity numeric(10,1),
ADD COLUMN average_fuel_burn numeric(10,1);