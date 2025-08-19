import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';

export const useUserTheme = () => {
  const { setTheme } = useTheme();

  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('theme')
            .eq('user_id', user.id)
            .single();
            
          if (!error && profile?.theme) {
            setTheme(profile.theme);
          }
        }
      } catch (error) {
        console.error('Error loading user theme preference:', error);
      }
    };

    // Load theme when component mounts
    loadUserTheme();

    // Listen for auth state changes to load theme for new logins
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Small delay to ensure profile is available
        setTimeout(loadUserTheme, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [setTheme]);
};