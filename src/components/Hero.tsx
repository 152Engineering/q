import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import AuthModal from "@/components/AuthModal";
import cessnaHero from "@/assets/cessna-hero.png";

const Hero = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);



  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] md:h-[80vh] flex items-center justify-center relative overflow-hidden py-8 md:py-0">
      <div 
        className="absolute inset-0 bg-no-repeat bg-center bg-cover opacity-10 pointer-events-none"
        style={{ backgroundImage: `url(${cessnaHero})` }}
      />
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 md:mb-6">
            Elevate Your
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {" "}Flying Experience
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed">
            Complete digital flight management for pilots. Plan, track, and log your flights with precision and ease.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 md:mb-16">
            <Button 
              size="lg" 
              className="text-base md:text-lg px-6 md:px-8 py-3 md:py-4 h-auto w-full sm:w-auto"
              onClick={scrollToPricing}
            >
              Start Flying
              <ArrowRight className="ml-2 h-4 md:h-5 w-4 md:w-5" />
            </Button>
          </div>

        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </section>
  );
};

export default Hero;