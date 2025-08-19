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
import TipTapEditor from './TipTapEditor';
import { Badge } from '@/components/ui/badge';

interface PricingFeature {
  id: string;
  plan_type: string;
  feature_text: string;
  display_order: number;
  is_active: boolean;
}

interface PricingHeader {
  id: string;
  heading: string;
  subheading: string;
}

const PricingSectionCMS: React.FC = () => {
  const [features, setFeatures] = useState<PricingFeature[]>([]);
  const [header, setHeader] = useState<PricingHeader | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('propeller');
  const { toast } = useToast();

  const planTypes = [
    { value: 'propeller', label: 'Propeller' },
    { value: 'turboprop', label: 'Turboprop' },
    { value: 'turbojet', label: 'Turbojet' }
  ];

  useEffect(() => {
    fetchPricingContent();
  }, []);

  const fetchPricingContent = async () => {
    try {
      // Fetch header
      const { data: headerData, error: headerError } = await supabase
        .from('cms_pricing_header')
        .select('*')
        .single();

      if (headerError) throw headerError;
      setHeader(headerData);

      // Fetch features
      const { data: featuresData, error: featuresError } = await supabase
        .from('cms_pricing_features')
        .select('*')
        .order('plan_type, display_order');

      if (featuresError) throw featuresError;
      setFeatures(featuresData || []);
    } catch (error) {
      console.error('Error fetching pricing content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pricing content',
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
        .from('cms_pricing_header')
        .update({
          heading: header.heading,
          subheading: header.subheading,
        })
        .eq('id', header.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Pricing header updated successfully',
      });
    } catch (error) {
      console.error('Error saving pricing header:', error);
      toast({
        title: 'Error',
        description: 'Failed to save pricing header',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeature = async (feature: PricingFeature) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cms_pricing_features')
        .update({
          feature_text: feature.feature_text,
          is_active: feature.is_active,
        })
        .eq('id', feature.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Pricing feature updated successfully',
      });
    } catch (error) {
      console.error('Error saving pricing feature:', error);
      toast({
        title: 'Error',
        description: 'Failed to save pricing feature',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = async () => {
    const planFeatures = features.filter(f => f.plan_type === selectedPlan);
    const newFeature = {
      plan_type: selectedPlan,
      feature_text: 'New feature',
      display_order: planFeatures.length + 1,
      is_active: true,
    };

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('cms_pricing_features')
        .insert([newFeature])
        .select()
        .single();

      if (error) throw error;

      setFeatures([...features, data]);
      toast({
        title: 'Success',
        description: 'Pricing feature added successfully',
      });
    } catch (error) {
      console.error('Error adding pricing feature:', error);
      toast({
        title: 'Error',
        description: 'Failed to add pricing feature',
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
        .from('cms_pricing_features')
        .delete()
        .eq('id', featureId);

      if (error) throw error;

      setFeatures(features.filter(f => f.id !== featureId));
      toast({
        title: 'Success',
        description: 'Pricing feature deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting pricing feature:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete pricing feature',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (featureId: string, updates: Partial<PricingFeature>) => {
    setFeatures(features.map(f => 
      f.id === featureId ? { ...f, ...updates } : f
    ));
  };

  const filteredFeatures = features.filter(f => f.plan_type === selectedPlan);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pricing Section</CardTitle>
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
          <CardTitle>Pricing Header</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {header && (
            <>
              <div className="space-y-2">
                <Label>Heading</Label>
                <TipTapEditor
                  content={header.heading}
                  onUpdate={(newContent) => setHeader({ ...header, heading: newContent })}
                  placeholder="Enter pricing heading..."
                />
              </div>

              <div className="space-y-2">
                <Label>Subheading</Label>
                <TipTapEditor
                  content={header.subheading}
                  onUpdate={(newContent) => setHeader({ ...header, subheading: newContent })}
                  placeholder="Enter pricing subheading..."
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

      {/* Pricing Features */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pricing Features</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {planTypes.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddFeature} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Manage features for the {planTypes.find(p => p.value === selectedPlan)?.label} plan. These will appear on both the homepage and account settings.
          </div>
          
          {filteredFeatures.map((feature, index) => (
            <div key={feature.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              
              <div className="flex-1">
                <Input
                  value={feature.feature_text}
                  onChange={(e) => updateFeature(feature.id, { feature_text: e.target.value })}
                  placeholder="Enter feature text..."
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={feature.is_active}
                  onCheckedChange={(checked) => updateFeature(feature.id, { is_active: checked })}
                />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
              
              <Button
                onClick={() => handleSaveFeature(feature)}
                disabled={saving}
                size="sm"
                variant="outline"
              >
                <Save className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteFeature(feature.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {filteredFeatures.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No features found for {planTypes.find(p => p.value === selectedPlan)?.label} plan.
              <br />
              <Button onClick={handleAddFeature} variant="outline" className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add First Feature
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingSectionCMS;