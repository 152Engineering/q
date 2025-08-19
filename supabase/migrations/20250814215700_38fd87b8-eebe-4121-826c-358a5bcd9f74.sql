-- Create airport_ident table for airport reference data
CREATE TABLE public.airport_ident (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ident TEXT NOT NULL UNIQUE,
  type TEXT,
  name TEXT,
  elevation_ft INTEGER,
  iso_country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (but make it publicly readable since it's reference data)
ALTER TABLE public.airport_ident ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read airport data
CREATE POLICY "Airport identifiers are viewable by everyone" 
ON public.airport_ident 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_airport_ident_updated_at
BEFORE UPDATE ON public.airport_ident
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on ident for faster lookups
CREATE INDEX idx_airport_ident_ident ON public.airport_ident(ident);

-- Create index on iso_country for filtering by country
CREATE INDEX idx_airport_ident_country ON public.airport_ident(iso_country);