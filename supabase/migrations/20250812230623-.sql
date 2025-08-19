-- Create flight table
CREATE TABLE public.flights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  aircraft_id UUID REFERENCES public.aircraft(id) ON DELETE CASCADE,
  flight_date DATE NOT NULL,
  departure TEXT NOT NULL,
  arrival TEXT NOT NULL,
  flight_details TEXT,
  flight_rules TEXT NOT NULL DEFAULT 'VFR' CHECK (flight_rules IN ('VFR', 'IFR')),
  flight_type TEXT NOT NULL DEFAULT 'Local' CHECK (flight_type IN ('Local', 'Cross Country')),
  day_night TEXT NOT NULL DEFAULT 'Day' CHECK (day_night IN ('Day', 'Night')),
  flight_time NUMERIC(4,1),
  instrument_actual NUMERIC(4,1),
  instrument_simulated NUMERIC(4,1),
  instrument_ground NUMERIC(4,1),
  takeoffs INTEGER DEFAULT 0,
  precision_approaches INTEGER DEFAULT 0,
  non_precision_approaches INTEGER DEFAULT 0,
  landings INTEGER DEFAULT 0,
  aircraft_hobbs_start NUMERIC(8,1),
  aircraft_hobbs_end NUMERIC(8,1),
  aircraft_tacho_start NUMERIC(8,2),
  aircraft_tacho_end NUMERIC(8,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flight crew table
CREATE TABLE public.flight_crew (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flight_id UUID REFERENCES public.flights(id) ON DELETE CASCADE,
  crew_member_id UUID REFERENCES public.crew(id) ON DELETE CASCADE,
  is_self BOOLEAN DEFAULT FALSE,
  role TEXT NOT NULL CHECK (role IN ('Pilot in Command', 'Instructor', 'Student', 'Co-Pilot')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_crew ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flights
CREATE POLICY "Users can view their own flights" 
ON public.flights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flights" 
ON public.flights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flights" 
ON public.flights 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flights" 
ON public.flights 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for flight_crew
CREATE POLICY "Users can view flight crew for their flights" 
ON public.flight_crew 
FOR SELECT 
USING (flight_id IN (SELECT id FROM public.flights WHERE user_id = auth.uid()));

CREATE POLICY "Users can create flight crew for their flights" 
ON public.flight_crew 
FOR INSERT 
WITH CHECK (flight_id IN (SELECT id FROM public.flights WHERE user_id = auth.uid()));

CREATE POLICY "Users can update flight crew for their flights" 
ON public.flight_crew 
FOR UPDATE 
USING (flight_id IN (SELECT id FROM public.flights WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete flight crew for their flights" 
ON public.flight_crew 
FOR DELETE 
USING (flight_id IN (SELECT id FROM public.flights WHERE user_id = auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_flights_updated_at
BEFORE UPDATE ON public.flights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();