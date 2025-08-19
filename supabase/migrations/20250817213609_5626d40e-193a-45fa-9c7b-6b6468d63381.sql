-- Fix subscribers table RLS policies for better security
-- The current policies use both user_id and email checks which creates unnecessary complexity
-- and potential security vulnerabilities. We'll simplify to use only user_id checks
-- and add proper admin access.

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can insert their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can delete their own subscription" ON public.subscribers;

-- Create simplified, more secure policies
-- Users can only view their own subscription data
CREATE POLICY "Users can view their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only insert their own subscription data
CREATE POLICY "Users can insert their own subscription"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subscription data
CREATE POLICY "Users can update their own subscription"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own subscription data
CREATE POLICY "Users can delete their own subscription"
ON public.subscribers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add Super Admin access for subscription management
CREATE POLICY "Super Admins can manage all subscriptions"
ON public.subscribers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.account_type = 'Super Admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.account_type = 'Super Admin'
  )
);