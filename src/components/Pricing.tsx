import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import AuthModal from "./AuthModal";

const Pricing = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{ planType: string; annual: boolean } | null>(null);

  const handleSubscribe = async (planType: string) => {
    setLoading(planType);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPendingPlan({ planType, annual: isAnnual });
        setShowAuthModal(true);
        setLoading(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          planType,
          billing_period: isAnnual ? 'annual' : 'monthly'
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    setPendingPlan(null);
  };

  // Check if user logged in after auth modal closes
  const handleAuthSuccess = async () => {
    if (pendingPlan) {
      const { planType, annual } = pendingPlan;
      setPendingPlan(null);
      
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        handleSubscribe(planType);
      }, 500);
    }
  };

  const plans = [
    {
      name: "Propeller",
      monthlyPrice: 9,
      annualPrice: 95,
      description: "Perfect for student and recreational pilots",
      features: [
        "Digital Pilot Logbook (15 flights per month)",
        "Experience Reports",
        "Flying Experience Dashboard",
        "Up to 10 Aircraft",
        "One checklist",
        "Licences, Ratings & Instructor Sign Offs",
        "E6B Flight Computer",
        "Data Import / Export",
        "Paper Logbook Digitisation*"
      ],
      popular: false,
      planType: "propeller"
    },
    {
      name: "Turboprop",
      monthlyPrice: 14,
      annualPrice: 140,
      description: "Ideal for active pilots",
      features: [
        "Everything in Propeller, plus:",
        "30 Flights per month",
        "20 Aircraft",
        "10 checklists",
        "PDF Viewer",
        "ScratchPad",
        "15% Discount on Paper Logbook Digitisation*"
      ],
      popular: true,
      planType: "turboprop"
    },
    {
      name: "Turbojet",
      monthlyPrice: 24,
      annualPrice: 230,
      description: "Great for active pilots and owners",
      features: [
        "Unlimited Flights",
        "Unlimited Aircraft",
        "Unlimited Checklists",
        "Everything in Turboprop, plus:",
        "Aircraft Maintenance Tracking",
        "Syndicate Bookings",
        "Personal Plus Subscription to AirBudget",
        "Track and manage flying expenses",
        "25% Discount on Paper Logbook Digitisation*"
      ],
      popular: false,
      planType: "turbojet"
    }
  ];

  return (
    <>
      <section id="pricing" className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Choose the plan that fits your flying needs. All plans include core EFB functionality.
            </p>
            
            {/* Monthly/Annual Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <Label htmlFor="billing-toggle" className={`${!isAnnual ? 'font-semibold' : ''}`}>
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label htmlFor="billing-toggle" className={`${isAnnual ? 'font-semibold' : ''}`}>
                Annual
                <Badge variant="secondary" className="ml-2">Save up to 20%</Badge>
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              const period = isAnnual ? "/year" : "/month";
              const savings = isAnnual ? Math.round(((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12)) * 100) : 0;
              
              return (
                <Card 
                  key={index} 
                  className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="text-muted-foreground">{period}</span>
                      {isAnnual && savings > 0 && (
                        <div className="text-sm text-green-600 mt-1">
                          Save {savings}% vs monthly
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.planType)}
                      disabled={loading === plan.planType}
                    >
                      {loading === plan.planType ? "Loading..." : "Register for Free for 14 days!"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              *Paper Logbook Digitisation service available separately
            </p>
          </div>
        </div>
      </section>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={handleAuthModalClose}
      />
    </>
  );
};

export default Pricing;