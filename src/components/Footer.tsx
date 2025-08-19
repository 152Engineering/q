import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFooterLinks } from "@/hooks/useFooterLinks";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { getLinksBySection, loading } = useFooterLinks();

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div>
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
            <p className="text-muted-foreground">
              Built with passion by Kiwi Pilots.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="https://www.facebook.com/profile.php?id=61564526200010" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-facebook-f"></i>
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="https://www.instagram.com/airlogsnz/" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i>
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="https://www.linkedin.com/company/airlogsnz" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </Button>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <div className="space-y-2 text-sm">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-16"></div>
                  <div className="h-4 bg-muted rounded w-12"></div>
                </div>
              ) : (
                getLinksBySection('product').map((link) => (
                  link.link_url.startsWith('/') ? (
                    <Link
                      key={link.id}
                      to={link.link_url}
                      className="block text-muted-foreground hover:text-foreground"
                    >
                      {link.link_text}
                    </Link>
                  ) : (
                    <a
                      key={link.id}
                      href={link.link_url}
                      className="block text-muted-foreground hover:text-foreground"
                    >
                      {link.link_text}
                    </a>
                  )
                ))
              )}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <div className="space-y-2 text-sm">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-16"></div>
                  <div className="h-4 bg-muted rounded w-12"></div>
                </div>
              ) : (
                getLinksBySection('company').map((link) => (
                  link.link_url.startsWith('/') ? (
                    <Link
                      key={link.id}
                      to={link.link_url}
                      className="block text-muted-foreground hover:text-foreground"
                    >
                      {link.link_text}
                    </Link>
                  ) : (
                    <a
                      key={link.id}
                      href={link.link_url}
                      className="block text-muted-foreground hover:text-foreground"
                    >
                      {link.link_text}
                    </a>
                  )
                ))
              )}
            </div>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <div className="space-y-2 text-sm">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                </div>
              ) : (
                getLinksBySection('support').map((link) => (
                  link.link_url.startsWith('/') ? (
                    <Link
                      key={link.id}
                      to={link.link_url}
                      className="block text-muted-foreground hover:text-foreground"
                    >
                      {link.link_text}
                    </Link>
                  ) : (
                    <a
                      key={link.id}
                      href={link.link_url}
                      className="block text-muted-foreground hover:text-foreground"
                    >
                      {link.link_text}
                    </a>
                  )
                ))
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Bottom Footer */}
        <div className="py-6 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} AirLogs. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/privacy-policy" className="hover:text-foreground">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-foreground">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;