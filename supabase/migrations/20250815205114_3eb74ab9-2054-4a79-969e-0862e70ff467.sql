-- Create table for AirBudget integration data
CREATE TABLE public.airbudget_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  api_key TEXT NOT NULL,
  selected_account_id TEXT,
  accounts_data JSONB,
  is_connected BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.airbudget_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own AirBudget integration" 
ON public.airbudget_integrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AirBudget integration" 
ON public.airbudget_integrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AirBudget integration" 
ON public.airbudget_integrations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AirBudget integration" 
ON public.airbudget_integrations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_airbudget_integrations_updated_at
BEFORE UPDATE ON public.airbudget_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();