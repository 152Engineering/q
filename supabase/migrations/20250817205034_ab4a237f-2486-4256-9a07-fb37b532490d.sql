-- Create FAQ table for Help Center
CREATE TABLE public.cms_help_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on FAQ table
ALTER TABLE public.cms_help_faqs ENABLE ROW LEVEL SECURITY;

-- Create policies for public viewing of published FAQs
CREATE POLICY "Public can view published FAQs" 
ON public.cms_help_faqs 
FOR SELECT 
USING (is_published = true);

-- Create policies for Super Admin management
CREATE POLICY "Super Admins can manage FAQs" 
ON public.cms_help_faqs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND account_type = 'Super Admin'
));

CREATE POLICY "Super Admins can view all FAQs" 
ON public.cms_help_faqs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND account_type = 'Super Admin'
));

-- Create trigger for updating timestamps
CREATE TRIGGER update_cms_help_faqs_updated_at
BEFORE UPDATE ON public.cms_help_faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_cms_updated_at_column();

-- Insert default FAQs
INSERT INTO public.cms_help_faqs (question, answer, display_order) VALUES 
('How do I get started with AirLogs?', '<p>Getting started is easy! Sign up for an account, complete your profile setup, and you''ll be ready to start logging your flights.</p>', 1),
('Can I import my existing logbook data?', '<p>Yes! AirLogs supports importing data from various formats. Visit the Data Import/Export section in your dashboard.</p>', 2),
('Is my data secure?', '<p>Absolutely. We use enterprise-grade security measures including encryption, secure authentication, and regular security audits.</p>', 3),
('How do I add a new aircraft?', '<p>Navigate to Settings > Aircraft and click "Add Aircraft". Enter your aircraft details including tail number, make, model, and type.</p>', 4),
('Can I track maintenance schedules?', '<p>Yes! AirLogs includes aircraft maintenance tracking features to help you stay on top of required inspections and maintenance.</p>', 5);