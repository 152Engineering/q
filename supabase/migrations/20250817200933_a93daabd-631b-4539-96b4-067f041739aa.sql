-- Create CMS content tables for homepage management

-- Hero section table
CREATE TABLE public.cms_hero_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  heading TEXT NOT NULL DEFAULT 'Elevate Your Flying Experience',
  subheading TEXT NOT NULL DEFAULT 'Complete digital flight management for pilots. Plan, track, and log your flights with precision and ease.',
  background_image_url TEXT DEFAULT '/assets/cessna-hero.png',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Features section table
CREATE TABLE public.cms_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  icon_class TEXT NOT NULL, -- FontAwesome class like 'fas fa-plane'
  description TEXT NOT NULL,
  is_coming_soon BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Features section header content
CREATE TABLE public.cms_features_header (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  heading TEXT NOT NULL DEFAULT 'Useful Tools That Keeps You Flying',
  subheading TEXT NOT NULL DEFAULT 'A modern flight logging and management app helping you be a safe and efficient pilot.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pricing section features table
CREATE TABLE public.cms_pricing_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type TEXT NOT NULL, -- 'propeller', 'turboprop', 'turbojet'
  feature_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pricing section header content
CREATE TABLE public.cms_pricing_header (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  heading TEXT NOT NULL DEFAULT 'Simple, Transparent Pricing',
  subheading TEXT NOT NULL DEFAULT 'Choose the plan that fits your flying needs. All plans include core EFB functionality.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Footer links table
CREATE TABLE public.cms_footer_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_name TEXT NOT NULL, -- 'product', 'company', 'support'
  link_text TEXT NOT NULL,
  link_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cms_hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_features_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pricing_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pricing_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_footer_links ENABLE ROW LEVEL SECURITY;

-- Create policies for Super Admin access only for CMS content
CREATE POLICY "Super Admins can view all CMS hero content" 
ON public.cms_hero_content 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  )
);

CREATE POLICY "Super Admins can modify CMS hero content" 
ON public.cms_hero_content 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  )
);

-- Similar policies for other tables
CREATE POLICY "Super Admins can view all CMS features" 
ON public.cms_features 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  )
);

CREATE POLICY "Super Admins can modify CMS features" 
ON public.cms_features 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  )
);

CREATE POLICY "Super Admins can view CMS features header" 
ON public.cms_features_header 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  )
);

CREATE POLICY "Super Admins can modify CMS features header" 
ON public.cms_features_header 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  )
);

CREATE POLICY "Super Admins can view CMS pricing features" 
ON public.cms_pricing_features 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  )
);

CREATE POLICY "Super Admins can modify CMS pricing features" 
ON public.cms_pricing_features 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  )
);

CREATE POLICY "Super Admins can view CMS pricing header" 
ON public.cms_pricing_header 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  )
);

CREATE POLICY "Super Admins can modify CMS pricing header" 
ON public.cms_pricing_header 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  )
);

CREATE POLICY "Super Admins can view CMS footer links" 
ON public.cms_footer_links 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  )
);

CREATE POLICY "Super Admins can modify CMS footer links" 
ON public.cms_footer_links 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  )
);

-- Public read access for all CMS content (for homepage display)
CREATE POLICY "Public can view CMS hero content" 
ON public.cms_hero_content 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view CMS features" 
ON public.cms_features 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Public can view CMS features header" 
ON public.cms_features_header 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view CMS pricing features" 
ON public.cms_pricing_features 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Public can view CMS pricing header" 
ON public.cms_pricing_header 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view CMS footer links" 
ON public.cms_footer_links 
FOR SELECT 
USING (is_active = true);

-- Insert default content
INSERT INTO public.cms_hero_content (heading, subheading, background_image_url) VALUES (
  'Elevate Your Flying Experience',
  'Complete digital flight management for pilots. Plan, track, and log your flights with precision and ease.',
  '/assets/cessna-hero.png'
);

INSERT INTO public.cms_features_header (heading, subheading) VALUES (
  'Useful Tools That Keeps You Flying',
  'A modern flight logging and management app helping you be a safe and efficient pilot.'
);

INSERT INTO public.cms_pricing_header (heading, subheading) VALUES (
  'Simple, Transparent Pricing',
  'Choose the plan that fits your flying needs. All plans include core EFB functionality.'
);

-- Insert default features
INSERT INTO public.cms_features (title, icon_class, description, is_coming_soon, display_order) VALUES
('Flight Planning', 'fas fa-plane', 'Plan and track your flights with fuel calculations, live fuel & tank switch reminders, then save your flight to your logbook.', false, 1),
('Digital Logbook', 'fas fa-book-open', 'Maintain accurate flight records with automatic logging, detailed flight history, and regulatory compliance.', false, 2),
('Interactive Checklists', 'fas fa-clipboard-list', 'Stay safe with digital checklists for pre-flight, in-flight, and post-flight procedures.', true, 3),
('E6B Flight Computer', 'fas fa-calculator', 'Perform flight calculations with our built-in E6B computer for navigation, fuel, and performance.', true, 4),
('Fuel Management', 'fas fa-gas-pump', 'Track fuel consumption, tank switching, and fuel planning with precise monitoring tools.', false, 5),
('Aircraft Management', 'fas fa-cogs', 'Manage multiple aircraft profiles with performance data, maintenance schedules, and crew information.', true, 6),
('Document Viewer', 'fas fa-file-alt', 'Access charts, manuals, and aviation documents with our integrated PDF viewer.', true, 7),
('Flight Tools', 'fas fa-tachometer-alt', 'Access essential aviation tools including scratch pad, unit conversions, and flight computers.', true, 8);

-- Insert default pricing features
INSERT INTO public.cms_pricing_features (plan_type, feature_text, display_order) VALUES
('propeller', 'Digital Pilot Logbook (15 flights per month)', 1),
('propeller', 'Experience Reports', 2),
('propeller', 'Flying Experience Dashboard', 3),
('propeller', 'Up to 10 Aircraft', 4),
('propeller', 'One checklist', 5),
('propeller', 'Licences, Ratings & Instructor Sign Offs', 6),
('propeller', 'E6B Flight Computer', 7),
('propeller', 'Data Import / Export', 8),
('propeller', 'Paper Logbook Digitisation*', 9),
('turboprop', 'Everything in Propeller, plus:', 1),
('turboprop', '30 Flights per month', 2),
('turboprop', '20 Aircraft', 3),
('turboprop', '10 checklists', 4),
('turboprop', 'PDF Viewer', 5),
('turboprop', 'ScratchPad', 6),
('turboprop', '15% Discount on Paper Logbook Digitisation*', 7),
('turbojet', 'Unlimited Flights', 1),
('turbojet', 'Unlimited Aircraft', 2),
('turbojet', 'Unlimited Checklists', 3),
('turbojet', 'Everything in Turboprop, plus:', 4),
('turbojet', 'Aircraft Maintenance Tracking', 5),
('turbojet', 'Syndicate Bookings', 6),
('turbojet', 'Personal Plus Subscription to AirBudget', 7),
('turbojet', 'Track and manage flying expenses', 8),
('turbojet', '25% Discount on Paper Logbook Digitisation*', 9);

-- Insert default footer links
INSERT INTO public.cms_footer_links (section_name, link_text, link_url, display_order) VALUES
('product', 'Features', '#features', 1),
('product', 'Pricing', '#pricing', 2),
('company', 'About Us', '/about-us', 1),
('company', 'Contact', 'mailto:hello@airlogs.nz', 2),
('support', 'Help Center', '/help-center', 1);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_cms_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_cms_hero_content_updated_at
BEFORE UPDATE ON public.cms_hero_content
FOR EACH ROW
EXECUTE FUNCTION public.update_cms_updated_at_column();

CREATE TRIGGER update_cms_features_updated_at
BEFORE UPDATE ON public.cms_features
FOR EACH ROW
EXECUTE FUNCTION public.update_cms_updated_at_column();

CREATE TRIGGER update_cms_features_header_updated_at
BEFORE UPDATE ON public.cms_features_header
FOR EACH ROW
EXECUTE FUNCTION public.update_cms_updated_at_column();

CREATE TRIGGER update_cms_pricing_features_updated_at
BEFORE UPDATE ON public.cms_pricing_features
FOR EACH ROW
EXECUTE FUNCTION public.update_cms_updated_at_column();

CREATE TRIGGER update_cms_pricing_header_updated_at
BEFORE UPDATE ON public.cms_pricing_header
FOR EACH ROW
EXECUTE FUNCTION public.update_cms_updated_at_column();

CREATE TRIGGER update_cms_footer_links_updated_at
BEFORE UPDATE ON public.cms_footer_links
FOR EACH ROW
EXECUTE FUNCTION public.update_cms_updated_at_column();