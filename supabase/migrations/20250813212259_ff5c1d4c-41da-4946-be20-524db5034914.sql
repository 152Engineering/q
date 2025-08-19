-- Create aircraft_type_designators table
CREATE TABLE public.aircraft_type_designators (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    type TEXT NOT NULL,
    turbulence_category TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on type for faster lookups
CREATE INDEX idx_aircraft_type_designators_type ON public.aircraft_type_designators(type);

-- Enable Row Level Security
ALTER TABLE public.aircraft_type_designators ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read aircraft type designators (public data)
CREATE POLICY "Aircraft type designators are viewable by everyone" 
ON public.aircraft_type_designators 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_aircraft_type_designators_updated_at
BEFORE UPDATE ON public.aircraft_type_designators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();