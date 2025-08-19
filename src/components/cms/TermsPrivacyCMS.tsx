import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save } from 'lucide-react';
import TipTapEditor from './TipTapEditor';

interface ContentData {
  id: string;
  content: string;
  last_updated?: string;
}

const TermsPrivacyCMS: React.FC = () => {
  const [termsContent, setTermsContent] = useState<ContentData | null>(null);
  const [privacyContent, setPrivacyContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // Fetch Terms of Service content
      const { data: termsData, error: termsError } = await supabase
        .from('cms_terms_content')
        .select('*')
        .maybeSingle();

      if (termsError) throw termsError;
      setTermsContent(termsData);

      // Fetch Privacy Policy content
      const { data: privacyData, error: privacyError } = await supabase
        .from('cms_privacy_content')
        .select('*')
        .maybeSingle();

      if (privacyError) throw privacyError;
      setPrivacyContent(privacyData);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTerms = async () => {
    if (!termsContent) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_terms_content')
        .update({
          content: termsContent.content,
          last_updated: new Date().toISOString().split('T')[0],
        })
        .eq('id', termsContent.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Terms of Service updated successfully',
      });
    } catch (error) {
      console.error('Error saving terms content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save Terms of Service',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!privacyContent) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_privacy_content')
        .update({
          content: privacyContent.content,
          last_updated: new Date().toISOString().split('T')[0],
        })
        .eq('id', privacyContent.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Privacy Policy updated successfully',
      });
    } catch (error) {
      console.error('Error saving privacy content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save Privacy Policy',
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
          <CardTitle>Terms of Service & Privacy Policy</CardTitle>
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
        <CardTitle>Terms of Service & Privacy Policy</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="terms" className="space-y-4">
            {termsContent && (
              <>
                <div className="space-y-2">
                  <TipTapEditor
                    content={termsContent.content}
                    onUpdate={(newContent) => 
                      setTermsContent({ ...termsContent, content: newContent })
                    }
                    placeholder="Enter Terms of Service content..."
                  />
                </div>
                <Button onClick={handleSaveTerms} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Terms of Service'}
                </Button>
                {termsContent.last_updated && (
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(termsContent.last_updated).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="privacy" className="space-y-4">
            {privacyContent && (
              <>
                <div className="space-y-2">
                  <TipTapEditor
                    content={privacyContent.content}
                    onUpdate={(newContent) => 
                      setPrivacyContent({ ...privacyContent, content: newContent })
                    }
                    placeholder="Enter Privacy Policy content..."
                  />
                </div>
                <Button onClick={handleSavePrivacy} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Privacy Policy'}
                </Button>
                {privacyContent.last_updated && (
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(privacyContent.last_updated).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TermsPrivacyCMS;