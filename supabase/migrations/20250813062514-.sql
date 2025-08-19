-- Add status field to flights table to track incomplete flights
ALTER TABLE public.flights 
ADD COLUMN status text NOT NULL DEFAULT 'complete';

-- Add index for better performance when querying by status
CREATE INDEX idx_flights_status ON public.flights(status);

-- Update existing flights to be marked as complete
UPDATE public.flights SET status = 'complete' WHERE status = 'complete';