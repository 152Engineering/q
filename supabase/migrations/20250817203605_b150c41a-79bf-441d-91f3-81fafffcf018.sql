-- Create CMS content tables for Terms of Service, Privacy Policy, About Us, and Help Center

-- Terms of Service content
CREATE TABLE public.cms_terms_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL DEFAULT 'Terms of Service content goes here...',
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Privacy Policy content
CREATE TABLE public.cms_privacy_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL DEFAULT 'Privacy Policy content goes here...',
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- About Us content
CREATE TABLE public.cms_about_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL DEFAULT 'About Us content goes here...',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Help Center articles
CREATE TABLE public.cms_help_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cms_terms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_privacy_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_help_articles ENABLE ROW LEVEL SECURITY;

-- Create policies for public viewing
CREATE POLICY "Public can view Terms of Service content" 
ON public.cms_terms_content 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view Privacy Policy content" 
ON public.cms_privacy_content 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view About Us content" 
ON public.cms_about_content 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view published help articles" 
ON public.cms_help_articles 
FOR SELECT 
USING (is_published = true);

-- Create policies for Super Admin management
CREATE POLICY "Super Admins can manage Terms of Service content" 
ON public.cms_terms_content 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND account_type = 'Super Admin'
));

CREATE POLICY "Super Admins can manage Privacy Policy content" 
ON public.cms_privacy_content 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND account_type = 'Super Admin'
));

CREATE POLICY "Super Admins can manage About Us content" 
ON public.cms_about_content 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND account_type = 'Super Admin'
));

CREATE POLICY "Super Admins can manage help articles" 
ON public.cms_help_articles 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND account_type = 'Super Admin'
));

CREATE POLICY "Super Admins can view all help articles" 
ON public.cms_help_articles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND account_type = 'Super Admin'
));

-- Create triggers for updating timestamps
CREATE TRIGGER update_cms_terms_content_updated_at
BEFORE UPDATE ON public.cms_terms_content
FOR EACH ROW
EXECUTE FUNCTION public.update_cms_updated_at_column();

CREATE TRIGGER update_cms_privacy_content_updated_at
BEFORE UPDATE ON public.cms_privacy_content
FOR EACH ROW
EXECUTE FUNCTION public.update_cms_updated_at_column();

CREATE TRIGGER update_cms_about_content_updated_at
BEFORE UPDATE ON public.cms_about_content
FOR EACH ROW
EXECUTE FUNCTION public.update_cms_updated_at_column();

CREATE TRIGGER update_cms_help_articles_updated_at
BEFORE UPDATE ON public.cms_help_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_cms_updated_at_column();

-- Insert default content
INSERT INTO public.cms_terms_content (content) VALUES (
  '<h1>Terms of Service</h1><p>Welcome to our Terms of Service. Please read these terms carefully as they govern your use of our services.</p><h2>1. Acceptance of Terms</h2><p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p><h2>2. User Responsibilities</h2><p>Users are responsible for maintaining the security of their account and password.</p>'
);

INSERT INTO public.cms_privacy_content (content) VALUES (
  '<h1>Privacy Policy</h1><p>Your privacy is important to us. This privacy policy explains how we collect, use, and protect your information.</p><h2>1. Information We Collect</h2><p>We collect information you provide directly to us, such as when you create an account or contact us.</p><h2>2. How We Use Information</h2><p>We use the information we collect to provide, maintain, and improve our services.</p>'
);

INSERT INTO public.cms_about_content (content) VALUES (
  '<h1>About Us</h1><p>We are passionate about aviation and dedicated to providing pilots with the best digital flight management tools.</p><h2>Our Mission</h2><p>To modernize flight logging and management through innovative technology that enhances safety and efficiency for pilots worldwide.</p><h2>Our Team</h2><p>Our team consists of experienced pilots and software developers who understand the unique needs of the aviation community.</p>'
);

INSERT INTO public.cms_help_articles (title, content, slug, display_order) VALUES 
('Getting Started', '<h1>Getting Started</h1><p>Welcome to our flight management system! This guide will help you get started with your account setup and first flight entry.</p><h2>Creating Your Profile</h2><p>Start by completing your pilot profile with your license information and preferences.</p>', 'getting-started', 1),
('Flight Logging', '<h1>Flight Logging</h1><p>Learn how to log your flights effectively and maintain accurate records.</p><h2>Adding a New Flight</h2><p>Navigate to the logbook section and click "Add New Flight" to begin entering your flight details.</p>', 'flight-logging', 2),
('Aircraft Management', '<h1>Aircraft Management</h1><p>Manage your aircraft fleet and track maintenance schedules.</p><h2>Adding Aircraft</h2><p>Add your aircraft by entering the tail number, make, model, and other relevant details.</p>', 'aircraft-management', 3);