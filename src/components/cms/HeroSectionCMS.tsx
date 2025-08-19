import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Upload } from 'lucide-react';
import TipTapEditor from './TipTapEditor';

interface HeroContent {
  id: string;
  heading: string;
  subheading: string;
  background_image_url: string;
}

const HeroSectionCMS: React.FC = () => {
  const [content, setContent] = useState<HeroContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchHeroContent();
  }, []);

  const fetchHeroContent = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_hero_content')
        .select('*')
        .single();

      if (error) throw error;
      setContent(data);
    } catch (error) {
      console.error('Error fetching hero content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hero content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_hero_content')
        .update({
          heading: content.heading,
          subheading: content.subheading,
          background_image_url: content.background_image_url,
        })
        .eq('id', content.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Hero section updated successfully',
      });
    } catch (error) {
      console.error('Error saving hero content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save hero content',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = () => {
    // For now, we'll use a simple prompt for image URL
    // In the future, this could be enhanced with file upload
    const url = window.prompt('Enter image URL:');
    if (url && content) {
      setContent({ ...content, background_image_url: url });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!content) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hero content found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="heading">Heading</Label>
          <TipTapEditor
            content={content.heading}
            onUpdate={(newContent) => setContent({ ...content, heading: newContent })}
            placeholder="Enter hero heading..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subheading">Subheading</Label>
          <TipTapEditor
            content={content.subheading}
            onUpdate={(newContent) => setContent({ ...content, subheading: newContent })}
            placeholder="Enter hero subheading..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="background_image">Background Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="background_image"
              value={content.background_image_url || ''}
              onChange={(e) => setContent({ ...content, background_image_url: e.target.value })}
              placeholder="Enter image URL..."
            />
            <Button variant="outline" onClick={handleImageUpload}>
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {content.background_image_url && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-muted/20">
              <img 
                src={content.background_image_url} 
                alt="Background preview" 
                className="max-w-full h-32 object-cover rounded"
              />
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default HeroSectionCMS;