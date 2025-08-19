import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AccessRestrictionProps {
  children: ReactNode;
  isAllowed: boolean;
  reason: 'subscription' | 'trial_expired' | 'flight_limit' | 'aircraft_limit' | 'tool_access';
  currentCount?: number;
  limit?: number;
  requiredPlan?: string;
}

const AccessRestriction = ({ 
  children, 
  isAllowed, 
  reason, 
  currentCount, 
  limit, 
  requiredPlan 
}: AccessRestrictionProps) => {
  const navigate = useNavigate();

  if (isAllowed) {
    return <>{children}</>;
  }

  const getRestrictionMessage = () => {
    switch (reason) {
      case 'subscription':
        return {
          title: 'Subscription Required',
          description: 'This feature requires an active subscription to continue.',
        };
      case 'trial_expired':
        return {
          title: 'Free Trial Expired',
          description: 'Your 14-day free trial has ended. Please upgrade to continue using the app.',
        };
      case 'flight_limit':
        return {
          title: 'Flight Limit Reached',
          description: `You've reached your monthly limit of ${limit} flights. Upgrade to add more flights.`,
        };
      case 'aircraft_limit':
        return {
          title: 'Aircraft Limit Reached',
          description: `You've reached your limit of ${limit} aircraft. Upgrade to add more aircraft.`,
        };
      case 'tool_access':
        return {
          title: 'Feature Not Available',
          description: `This feature is available with ${requiredPlan} plan and above.`,
        };
      default:
        return {
          title: 'Access Restricted',
          description: 'This feature is not available with your current plan.',
        };
    }
  };

  const { title, description } = getRestrictionMessage();

  const handleUpgrade = () => {
    navigate('/settings?tab=subscription');
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {currentCount !== undefined && limit !== undefined && (
            <div className="mb-4 text-sm text-muted-foreground">
              Current usage: {currentCount} / {limit}
            </div>
          )}
          <Button onClick={handleUpgrade} className="w-full">
            <ArrowUp className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessRestriction;