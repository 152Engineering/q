import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FooterLink {
  id: string;
  section_name: string;
  link_text: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
}

export const useFooterLinks = () => {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFooterLinks();
  }, []);

  const fetchFooterLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_footer_links')
        .select('*')
        .eq('is_active', true)
        .order('section_name, display_order');

      if (error) {
        console.error('Error fetching footer links:', error);
        // Fall back to default links if CMS fails
        setLinks(getDefaultFooterLinks());
      } else {
        setLinks(data || getDefaultFooterLinks());
      }
    } catch (error) {
      console.error('Error fetching footer links:', error);
      setLinks(getDefaultFooterLinks());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultFooterLinks = (): FooterLink[] => [
    {
      id: 'default-1',
      section_name: 'product',
      link_text: 'Features',
      link_url: '/#features',
      display_order: 1,
      is_active: true,
    },
    {
      id: 'default-2',
      section_name: 'product',
      link_text: 'Pricing',
      link_url: '/#pricing',
      display_order: 2,
      is_active: true,
    },
    {
      id: 'default-3',
      section_name: 'company',
      link_text: 'About Us',
      link_url: '/about-us',
      display_order: 1,
      is_active: true,
    },
    {
      id: 'default-4',
      section_name: 'company',
      link_text: 'Contact',
      link_url: 'mailto:hello@airlogs.nz',
      display_order: 2,
      is_active: true,
    },
    {
      id: 'default-5',
      section_name: 'support',
      link_text: 'Help Center',
      link_url: '/help-center',
      display_order: 1,
      is_active: true,
    },
  ];

  const getLinksBySection = (sectionName: string) => 
    links.filter(link => link.section_name === sectionName);

  return {
    links,
    loading,
    getLinksBySection,
  };
};