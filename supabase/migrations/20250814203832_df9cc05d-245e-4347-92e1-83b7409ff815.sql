-- Create account type enum
CREATE TYPE public.account_type AS ENUM ('Super Admin', 'Propeller', 'Turboprop', 'Turbojet');

-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  account_type public.account_type NOT NULL DEFAULT 'Propeller',
  subscription_end TIMESTAMPTZ,
  monthly_billing BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for subscribers table
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers
FOR SELECT 
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can update their own subscription" 
ON public.subscribers
FOR UPDATE 
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Edge functions can insert subscriptions" 
ON public.subscribers
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Edge functions can update subscriptions" 
ON public.subscribers
FOR UPDATE 
USING (true);

-- Add account_type column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN account_type public.account_type NOT NULL DEFAULT 'Propeller';

-- Create trigger for subscribers updated_at
CREATE TRIGGER update_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();