import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save } from 'lucide-react';
import TipTapEditor from './TipTapEditor';

interface AboutContent {
  id: string;
  content: string;
}

const AboutUsCMS: React.FC = () => {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_about_content')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      setContent(data);
    } catch (error) {
      console.error('Error fetching about content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load About Us content',
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
        .from('cms_about_content')
        .update({
          content: content.content,
        })
        .eq('id', content.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'About Us content updated successfully',
      });
    } catch (error) {
      console.error('Error saving about content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save About Us content',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>About Us Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>About Us Page Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {content && (
          <>
            <div className="space-y-2">
              <TipTapEditor
                content={content.content}
                onUpdate={(newContent) => setContent({ ...content, content: newContent })}
                placeholder="Enter About Us page content..."
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save About Us Content'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AboutUsCMS;