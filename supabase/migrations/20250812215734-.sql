-- Create enum types first
CREATE TYPE public.pilot_license_type AS ENUM (
  'Student',
  'Ultralight Pilot', 
  'Private Pilot',
  'Commercial Pilot',
  'Airline Pilot'
);

CREATE TYPE public.reminder_item_type AS ENUM (
  'Medical Examination',
  'Flight Check', 
  'IFR Proficiency Check',
  'Theory Exam'
);

CREATE TYPE public.aircraft_category_type AS ENUM (
  'Single-Engine Airplane Land',
  'Multi-Engine Airplane Land',
  'Single-Engine Airplane Sea', 
  'Multi-Engine Airplane Sea',
  'Single-Engine Helicopter',
  'Multi-Engine Helicopter'
);

-- Add new columns to profiles table for user preferences
ALTER TABLE public.profiles 
ADD COLUMN timezone TEXT DEFAULT 'UTC',
ADD COLUMN date_format TEXT DEFAULT 'YYYY-MM-DD',
ADD COLUMN currency TEXT DEFAULT 'USD',
ADD COLUMN pilot_license pilot_license_type DEFAULT 'Student';

-- Create reminders table (previously medicals)
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type reminder_item_type NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reminders
CREATE POLICY "Users can view their own reminders"
ON public.reminders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
ON public.reminders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
ON public.reminders
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
ON public.reminders
FOR DELETE
USING (auth.uid() = user_id);

-- Create aircraft table
CREATE TABLE public.aircraft (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tail_number TEXT NOT NULL,
  aircraft_type TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  category aircraft_category_type NOT NULL,
  hobbs_time DECIMAL(10,1),
  tacho_time DECIMAL(10,2),
  cost_per_hour DECIMAL(10,2),
  export_to_airbudget BOOLEAN DEFAULT false,
  aircraft_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on aircraft
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for aircraft
CREATE POLICY "Users can view their own aircraft"
ON public.aircraft
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own aircraft"
ON public.aircraft
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own aircraft"
ON public.aircraft
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own aircraft"
ON public.aircraft
FOR DELETE
USING (auth.uid() = user_id);

-- Create crew table
CREATE TABLE public.crew (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on crew
ALTER TABLE public.crew ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for crew
CREATE POLICY "Users can view their own crew"
ON public.crew
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own crew"
ON public.crew
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crew"
ON public.crew
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own crew"
ON public.crew
FOR DELETE
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_reminders_updated_at
BEFORE UPDATE ON public.reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aircraft_updated_at
BEFORE UPDATE ON public.aircraft
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crew_updated_at
BEFORE UPDATE ON public.crew
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();