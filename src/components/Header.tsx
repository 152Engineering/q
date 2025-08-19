import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AuthModal from "./AuthModal";
import ContactModal from "./ContactModal";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const handleViewDashboard = () => {
    navigate("/app/dashboard");
  };

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features", isScroll: true },
    { label: "About", href: "/about-us" },
    { label: "Pricing", href: "#pricing", isScroll: true },
    { label: "Contact", href: "#contact", isButton: true },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-32">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/7a811e72-a13b-462b-b038-f84bc47a0879.png" 
                alt="AirLogs" 
                className="h-24 w-auto dark:hidden"
              />
              <img 
                src="/lovable-uploads/d5d76da1-7868-4622-854c-76dee215de09.png" 
                alt="AirLogs" 
                className="h-24 w-auto hidden dark:block"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {menuItems.map((item) => (
                item.isButton ? (
                  <button
                    key={item.label}
                    onClick={() => setIsContactModalOpen(true)}
                    className="text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </button>
                ) : item.isScroll ? (
                  <button
                    key={item.label}
                    onClick={() => handleScrollToSection(item.href.slice(1))}
                    className="text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </button>
                ) : item.href.startsWith("/") ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                )
              ))}
            </nav>

            {/* Desktop Auth/Dashboard Buttons */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Button onClick={handleViewDashboard}>
                    View Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="text-foreground hover:bg-secondary"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)}>
                  Login / Sign Up
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border">
                {menuItems.map((item) => (
                  item.isButton ? (
                    <button
                      key={item.label}
                      onClick={() => {
                        setIsContactModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </button>
                  ) : item.isScroll ? (
                    <button
                      key={item.label}
                      onClick={() => {
                        handleScrollToSection(item.href.slice(1));
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </button>
                  ) : item.href.startsWith("/") ? (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="block px-3 py-2 text-foreground/80 hover:text-foreground transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      className="block px-3 py-2 text-foreground/80 hover:text-foreground transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  )
                ))}
                <div className="px-3 py-2">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={() => {
                          handleViewDashboard();
                          setIsMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        View Dashboard
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Login / Sign Up
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </>
  );
};

export default Header;