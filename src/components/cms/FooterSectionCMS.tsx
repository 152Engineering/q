import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FooterLink {
  id: string;
  section_name: string;
  link_text: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
}

const FooterSectionCMS: React.FC = () => {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('product');
  const { toast } = useToast();

  const sectionTypes = [
    { value: 'product', label: 'Product' },
    { value: 'company', label: 'Company' },
    { value: 'support', label: 'Support' }
  ];

  useEffect(() => {
    fetchFooterLinks();
  }, []);

  const fetchFooterLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_footer_links')
        .select('*')
        .order('section_name, display_order');

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching footer links:', error);
      toast({
        title: 'Error',
        description: 'Failed to load footer links',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLink = async (link: FooterLink) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_footer_links')
        .update({
          link_text: link.link_text,
          link_url: link.link_url,
          is_active: link.is_active,
        })
        .eq('id', link.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Footer link updated successfully',
      });
    } catch (error) {
      console.error('Error saving footer link:', error);
      toast({
        title: 'Error',
        description: 'Failed to save footer link',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = async () => {
    const sectionLinks = links.filter(l => l.section_name === selectedSection);
    const newLink = {
      section_name: selectedSection,
      link_text: 'New Link',
      link_url: '#',
      display_order: sectionLinks.length + 1,
      is_active: true,
    };

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('cms_footer_links')
        .insert([newLink])
        .select()
        .single();

      if (error) throw error;

      setLinks([...links, data]);
      toast({
        title: 'Success',
        description: 'Footer link added successfully',
      });
    } catch (error) {
      console.error('Error adding footer link:', error);
      toast({
        title: 'Error',
        description: 'Failed to add footer link',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_footer_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      setLinks(links.filter(l => l.id !== linkId));
      toast({
        title: 'Success',
        description: 'Footer link deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting footer link:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete footer link',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateLink = (linkId: string, updates: Partial<FooterLink>) => {
    setLinks(links.map(l => 
      l.id === linkId ? { ...l, ...updates } : l
    ));
  };

  const filteredLinks = links.filter(l => l.section_name === selectedSection);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Footer Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Footer Links</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sectionTypes.map((section) => (
                <SelectItem key={section.value} value={section.value}>
                  {section.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddLink} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Manage links for the {sectionTypes.find(s => s.value === selectedSection)?.label} section of the footer.
        </div>
        
        {filteredLinks.map((link, index) => (
          <div key={link.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                value={link.link_text}
                onChange={(e) => updateLink(link.id, { link_text: e.target.value })}
                placeholder="Link text..."
                className="w-full"
              />
              <Input
                value={link.link_url}
                onChange={(e) => updateLink(link.id, { link_url: e.target.value })}
                placeholder="Link URL..."
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={link.is_active}
                onCheckedChange={(checked) => updateLink(link.id, { is_active: checked })}
              />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            
            <Button
              onClick={() => handleSaveLink(link)}
              disabled={saving}
              size="sm"
              variant="outline"
            >
              <Save className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteLink(link.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {filteredLinks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No links found for {sectionTypes.find(s => s.value === selectedSection)?.label} section.
            <br />
            <Button onClick={handleAddLink} variant="outline" className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add First Link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FooterSectionCMS;