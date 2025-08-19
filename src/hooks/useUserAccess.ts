import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserAccess {
  accountType: string;
  hasSubscription: boolean;
  canAccessApp: boolean;
  isSuperAdmin: boolean;
  hasAdminOverride: boolean;
  loading: boolean;
}

export interface UserLimits {
  flightLimit: number;
  aircraftLimit: number;
  currentFlights: number;
  currentAircraft: number;
  canAddFlight: boolean;
  canAddAircraft: boolean;
  allowedTools: string[];
}

export const useUserAccess = () => {
  const [access, setAccess] = useState<UserAccess>({
    accountType: 'Propeller',
    hasSubscription: false,
    canAccessApp: true,
    isSuperAdmin: false,
    hasAdminOverride: false,
    loading: false,
  });

  const [limits, setLimits] = useState<UserLimits>({
    flightLimit: 15,
    aircraftLimit: 10,
    currentFlights: 0,
    currentAircraft: 0,
    canAddFlight: true,
    canAddAircraft: true,
    allowedTools: [],
  });

  const checkUserAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setAccess(prev => ({ ...prev, canAccessApp: false }));
        return;
      }

      // For authenticated users, just set basic access without any subscription checks
      setAccess({
        accountType: 'Propeller',
        hasSubscription: true, // Always true since no restrictions
        canAccessApp: true,
        isSuperAdmin: false, // We can check this if needed, but no subscription logic
        hasAdminOverride: false,
        loading: false,
      });

      // Set unlimited access for all users
      setLimits({
        flightLimit: -1, // Unlimited
        aircraftLimit: -1, // Unlimited
        currentFlights: 0, // Not needed anymore
        currentAircraft: 0, // Not needed anymore
        canAddFlight: true,
        canAddAircraft: true,
        allowedTools: [
          'Checklists',
          'Licenses, Ratings & Endorsements',
          'Instructor / Examiner Sign-Offs',
          'E6B Flight Computer',
          'Data Import / Export',
          'Reports',
          'PDF Viewer',
          'ScratchPad',
          'Aircraft Maintenance',
          'Syndicate Calendar',
          'Budgets',
          'IFR Clearances'
        ],
      });
    } catch (error) {
      console.error('Error checking user access:', error);
      // Even on error, allow access for authenticated users
      setAccess(prev => ({ ...prev, canAccessApp: true }));
    }
  };

  useEffect(() => {
    checkUserAccess();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserAccess();
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshAccess = () => {
    checkUserAccess();
  };

  return {
    access,
    limits,
    refreshAccess,
  };
};