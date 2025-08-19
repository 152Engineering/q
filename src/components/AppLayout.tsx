import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FlightProvider } from "@/contexts/FlightContext";
import { usePinnedTools } from "@/hooks/usePinnedTools";
import { useUserTheme } from "@/hooks/useUserTheme";
import ActiveFlightModal from "@/components/ActiveFlightModal";
import FlightStatusIndicator from "@/components/FlightStatusIndicator";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { getPinnedToolsData } = usePinnedTools();
  
  // Load user's theme preference from database
  useUserTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/");
        setIsAdmin(false);
      } else if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/");
      } else {
        checkAdminStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", userId)
        .single();
      
      setIsAdmin(profile?.account_type === "Super Admin");
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setIsAdmin(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  const handleAccountSettings = () => {
    navigate("/app/settings");
  };

  const handlePinnedToolClick = (tool: any) => {
    if (tool.action) {
      tool.action();
    } else if (tool.path) {
      navigate(tool.path);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <FlightProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background text-foreground px-4 py-2.5 flex justify-between items-center border-b border-border">
          {mounted && (
            <img 
              src={theme === 'dark' 
                ? "/lovable-uploads/d5d76da1-7868-4622-854c-76dee215de09.png"
                : "/lovable-uploads/7a811e72-a13b-462b-b038-f84bc47a0879.png"
              } 
              alt="AirLogs" 
              className="h-12"
            />
          )}
          <div className="flex items-center gap-2">
            <FlightStatusIndicator />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/app/help")}
              className="text-foreground hover:bg-secondary"
              title="Help Center"
            >
              <i className="fas fa-question-circle"></i>
            </Button>
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/app/admin")}
                className="text-foreground hover:bg-secondary"
                title="Admin Portal"
              >
                <i className="fas fa-shield-alt"></i>
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleAccountSettings}
              className="text-foreground hover:bg-secondary"
              title="Account Settings"
            >
              <i className="fas fa-user"></i>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              className="text-foreground hover:bg-secondary"
              title="Sign Out"
            >
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-16">
          {children}
        </main>

        {/* Active Flight Modal */}
        <ActiveFlightModal />

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-background text-foreground border-t border-border">
          <div className="flex justify-around items-center py-2">
            <Button 
              variant="ghost" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-foreground hover:bg-secondary"
              onClick={() => navigate("/app/dashboard")}
            >
              <i className="fas fa-tachometer-alt text-lg"></i>
              <span className="text-xs">Dashboard</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-foreground hover:bg-secondary"
              onClick={() => navigate("/app/logbook")}
            >
              <i className="fas fa-book text-lg"></i>
              <span className="text-xs">Logbook</span>
            </Button>
            
            {/* Pinned Tools */}
            {getPinnedToolsData().map((tool, index) => (
              <Button 
                key={tool.title}
                variant="ghost" 
                className="flex flex-col items-center gap-1 h-auto py-2 px-2 text-foreground hover:bg-secondary"
                onClick={() => handlePinnedToolClick(tool)}
              >
                <i className={`fas ${tool.icon} text-lg`}></i>
                <span className="text-xs truncate max-w-16">{tool.title.split(' ')[0]}</span>
              </Button>
            ))}
            
            <Button 
              variant="ghost" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-foreground hover:bg-secondary"
              onClick={() => navigate("/app/tools")}
            >
              <i className="fas fa-toolbox text-lg"></i>
              <span className="text-xs">Tools</span>
            </Button>
          </div>
        </nav>
      </div>
    </FlightProvider>
  );
};

export default AppLayout;