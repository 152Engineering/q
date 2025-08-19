import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import TipTapEditor from './TipTapEditor';
import { Badge } from '@/components/ui/badge';

interface Feature {
  id: string;
  title: string;
  icon_class: string;
  description: string;
  is_coming_soon: boolean;
  display_order: number;
  is_active: boolean;
}

interface FeaturesHeader {
  id: string;
  heading: string;
  subheading: string;
}

const FeaturesSectionCMS: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [header, setHeader] = useState<FeaturesHeader | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeaturesContent();
  }, []);

  const fetchFeaturesContent = async () => {
    try {
      // Fetch header
      const { data: headerData, error: headerError } = await supabase
        .from('cms_features_header')
        .select('*')
        .single();

      if (headerError) throw headerError;
      setHeader(headerData);

      // Fetch features
      const { data: featuresData, error: featuresError } = await supabase
        .from('cms_features')
        .select('*')
        .order('display_order');

      if (featuresError) throw featuresError;
      setFeatures(featuresData || []);
    } catch (error) {
      console.error('Error fetching features content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load features content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHeader = async () => {
    if (!header) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_features_header')
        .update({
          heading: header.heading,
          subheading: header.subheading,
        })
        .eq('id', header.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Features header updated successfully',
      });
    } catch (error) {
      console.error('Error saving features header:', error);
      toast({
        title: 'Error',
        description: 'Failed to save features header',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeature = async (feature: Feature) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_features')
        .update({
          title: feature.title,
          icon_class: feature.icon_class,
          description: feature.description,
          is_coming_soon: feature.is_coming_soon,
          is_active: feature.is_active,
        })
        .eq('id', feature.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Feature updated successfully',
      });
    } catch (error) {
      console.error('Error saving feature:', error);
      toast({
        title: 'Error',
        description: 'Failed to save feature',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = async () => {
    const newFeature = {
      title: 'New Feature',
      icon_class: 'fas fa-star',
      description: 'Feature description',
      is_coming_soon: false,
      display_order: features.length + 1,
      is_active: true,
    };

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('cms_features')
        .insert([newFeature])
        .select()
        .single();

      if (error) throw error;

      setFeatures([...features, data]);
      toast({
        title: 'Success',
        description: 'Feature added successfully',
      });
    } catch (error) {
      console.error('Error adding feature:', error);
      toast({
        title: 'Error',
        description: 'Failed to add feature',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    if (!window.confirm('Are you sure you want to delete this feature?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_features')
        .delete()
        .eq('id', featureId);

      if (error) throw error;

      setFeatures(features.filter(f => f.id !== featureId));
      toast({
        title: 'Success',
        description: 'Feature deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete feature',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (featureId: string, updates: Partial<Feature>) => {
    setFeatures(features.map(f => 
      f.id === featureId ? { ...f, ...updates } : f
    ));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Features Section</CardTitle>
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
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle>Features Header</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {header && (
            <>
              <div className="space-y-2">
                <Label>Heading</Label>
                <TipTapEditor
                  content={header.heading}
                  onUpdate={(newContent) => setHeader({ ...header, heading: newContent })}
                  placeholder="Enter features heading..."
                />
              </div>

              <div className="space-y-2">
                <Label>Subheading</Label>
                <TipTapEditor
                  content={header.subheading}
                  onUpdate={(newContent) => setHeader({ ...header, subheading: newContent })}
                  placeholder="Enter features subheading..."
                />
              </div>

              <Button onClick={handleSaveHeader} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Header'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Features</CardTitle>
          <Button onClick={handleAddFeature} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {features.map((feature) => (
            <Card key={feature.id} className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  {feature.is_coming_soon && (
                    <Badge variant="secondary">Coming Soon</Badge>
                  )}
                  {!feature.is_active && (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFeature(feature.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={feature.title}
                      onChange={(e) => updateFeature(feature.id, { title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon Class (FontAwesome)</Label>
                    <Input
                      value={feature.icon_class}
                      onChange={(e) => updateFeature(feature.id, { icon_class: e.target.value })}
                      placeholder="fas fa-plane"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <TipTapEditor
                    content={feature.description}
                    onUpdate={(newContent) => updateFeature(feature.id, { description: newContent })}
                    placeholder="Enter feature description..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={feature.is_coming_soon}
                      onCheckedChange={(checked) => updateFeature(feature.id, { is_coming_soon: checked })}
                    />
                    <Label>Coming Soon</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={feature.is_active}
                      onCheckedChange={(checked) => updateFeature(feature.id, { is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>

                <Button
                  onClick={() => handleSaveFeature(feature)}
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Feature'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeaturesSectionCMS;