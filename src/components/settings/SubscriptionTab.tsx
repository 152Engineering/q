import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Check, Crown } from "lucide-react";

interface SubscriptionData {
  subscribed: boolean;
  account_type?: string;
  subscription_end?: string;
  has_admin_override?: boolean;
}

const SubscriptionTab = () => {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [planLoading, setPlanLoading] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  const checkSubscription = async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setSubscription({ subscribed: false });
        return;
      }

      // Get comprehensive user access data
      const { data: accessData, error: accessError } = await supabase
        .rpc('get_user_access_level', { user_id_param: session.user.id });

      if (accessError) throw accessError;

      if (accessData && accessData.length > 0) {
        const userAccess = accessData[0];
        setSubscription({
          subscribed: userAccess.has_subscription || false,
          account_type: userAccess.account_type,
          subscription_end: null, // Will be set by check-subscription if needed
          has_admin_override: userAccess.has_admin_override || false
        });

        // Also call check-subscription for Stripe subscription details
        try {
          const { data: stripeData, error: stripeError } = await supabase.functions.invoke('check-subscription');
          if (!stripeError && stripeData?.subscription_end) {
            setSubscription(prev => ({
              ...prev!,
              subscription_end: stripeData.subscription_end
            }));
          }
        } catch (stripeError) {
          console.warn('Could not fetch Stripe subscription details:', stripeError);
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Error",
        description: "Failed to check subscription status",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const openCustomerPortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management portal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planType: string) => {
    setPlanLoading(planType);
    
    try {
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
      setPlanLoading(null);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

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
        "One checklist"
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
        "PDF Viewer"
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
        "Personal Plus Subscription to AirBudget"
      ],
      popular: false,
      planType: "turbojet"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Current Subscription Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current Subscription</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkSubscription}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <div className="flex items-center gap-2">
                  <Badge variant={subscription.subscribed ? "default" : "secondary"}>
                    {subscription.subscribed ? "Active" : "Free"}
                  </Badge>
                  {subscription.has_admin_override && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Admin Override
                    </Badge>
                  )}
                </div>
              </div>
              
              {subscription.account_type && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Plan:</span>
                  <span className="text-sm">{subscription.account_type} Pilot</span>
                </div>
              )}
              
              {subscription.subscription_end && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Next billing:</span>
                  <span className="text-sm">
                    {new Date(subscription.subscription_end).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {subscription.subscribed && !subscription.has_admin_override && (
                <Button 
                  onClick={openCustomerPortal}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Manage Subscription
                </Button>
              )}
              
              {subscription.has_admin_override && (
                <div className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-lg">
                  <Crown className="h-4 w-4 mx-auto mb-2 text-yellow-500" />
                  Your subscription has been managed by an administrator.
                  Contact support for any subscription changes.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-muted-foreground text-center">
                Loading subscription status...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that fits your flying needs
          </CardDescription>
          
          {/* Monthly/Annual Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <Label htmlFor="billing-toggle-settings" className={`${!isAnnual ? 'font-semibold' : ''}`}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle-settings"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="billing-toggle-settings" className={`${isAnnual ? 'font-semibold' : ''}`}>
              Annual
              <Badge variant="secondary" className="ml-2">Save up to 20%</Badge>
            </Label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => {
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              const period = isAnnual ? "/year" : "/month";
              const savings = isAnnual ? Math.round(((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12)) * 100) : 0;
              const isCurrentPlan = subscription?.account_type?.toLowerCase() === plan.planType;
              
              return (
                <Card 
                  key={index} 
                  className={`relative ${plan.popular ? 'border-primary' : ''} ${isCurrentPlan ? 'bg-muted/50 border-green-500' : ''}`}
                >
                  {plan.popular && !isCurrentPlan && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  
                  {isCurrentPlan && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
                      Current Plan
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">${price}</span>
                      <span className="text-muted-foreground text-sm">{period}</span>
                      {isAnnual && savings > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          Save {savings}% vs monthly
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-4 text-sm">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="w-3 h-3 text-primary mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className="w-full" 
                      variant={isCurrentPlan ? "secondary" : plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.planType)}
                      disabled={planLoading === plan.planType || isCurrentPlan}
                      size="sm"
                    >
                      {planLoading === plan.planType ? "Loading..." : 
                       isCurrentPlan ? "Current Plan" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionTab;