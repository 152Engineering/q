-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Edge functions can insert subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Edge functions can update subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;

-- Create secure policies that only allow authenticated users to access their own data
CREATE POLICY "Authenticated users can view their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND auth.email() = email);

CREATE POLICY "Authenticated users can insert their own subscription"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND auth.email() = email);

CREATE POLICY "Authenticated users can update their own subscription"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND auth.email() = email)
WITH CHECK (auth.uid() = user_id AND auth.email() = email);

CREATE POLICY "Authenticated users can delete their own subscription"
ON public.subscribers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND auth.email() = email);

-- Ensure user_id cannot be NULL for security
ALTER TABLE public.subscribers 
ALTER COLUMN user_id SET NOT NULL;