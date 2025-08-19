import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useProfileComplete = () => {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProfileCompletion();
  }, []);

  const checkProfileCompletion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsProfileComplete(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, timezone, date_format, currency, pilot_license')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setIsProfileComplete(false);
        setLoading(false);
        return;
      }

      // Check if all required fields are filled (not null and not empty strings)
      const isComplete = !!(
        profile.first_name &&
        profile.last_name &&
        profile.timezone &&
        profile.date_format &&
        profile.currency &&
        profile.pilot_license
      );

      setIsProfileComplete(isComplete);
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setIsProfileComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfileStatus = () => {
    setLoading(true);
    checkProfileCompletion();
  };

  return { isProfileComplete, loading, refreshProfileStatus };
};