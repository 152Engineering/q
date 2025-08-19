import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AppAccessWrapperProps {
  children: ReactNode;
}

const AppAccessWrapper = ({ children }: AppAccessWrapperProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Start as true to avoid loading screen
  const navigate = useNavigate();

  // Simple authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/', { replace: true });
        return;
      }
      setIsAuthenticated(true);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        navigate('/', { replace: true });
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Just render children immediately for authenticated users
  return <>{children}</>;
};

export default AppAccessWrapper;