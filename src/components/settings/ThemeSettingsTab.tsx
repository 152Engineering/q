import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ThemeSettingsTab = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDarkMode = theme === 'dark';

  const handleThemeToggle = async (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setLoading(true);
    
    try {
      // Update theme in UI immediately
      setTheme(newTheme);
      
      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ theme: newTheme })
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error saving theme preference:', error);
          toast({
            title: "Error",
            description: "Failed to save theme preference",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Theme saved",
            description: `Switched to ${newTheme} mode and saved preference`,
          });
        }
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      toast({
        title: "Error", 
        description: "Failed to update theme",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary bg-primary/5 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          Theme Settings
        </CardTitle>
        <CardDescription>
          Choose between light and dark mode for the application interface.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="dark-mode" className="text-sm font-medium">
              Dark Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              Switch between light and dark appearance
            </p>
          </div>
          <Switch
            id="dark-mode"
            checked={isDarkMode}
            onCheckedChange={handleThemeToggle}
            disabled={loading}
          />
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Current theme: <span className="font-medium">{theme}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSettingsTab;