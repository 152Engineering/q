import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface FreeTrialModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  daysRemaining: number;
  trialExpired: boolean;
}

const FreeTrialModal = ({ isOpen, onDismiss, daysRemaining, trialExpired }: FreeTrialModalProps) => {
  const navigate = useNavigate();

  const handleUpgradeNow = () => {
    navigate('/settings?tab=subscription');
    onDismiss();
  };

  return (
    <Dialog open={isOpen} onOpenChange={trialExpired ? undefined : () => {}}>
      <DialogContent className="sm:max-w-md">{!trialExpired && <button onClick={onDismiss} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"><span className="sr-only">Close</span></button>}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {trialExpired ? (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Free Trial Expired
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-primary" />
                Free Trial
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          {trialExpired ? (
            <>
              <div className="text-muted-foreground">
                Your 14-day free trial has ended. Please upgrade to continue using the app.
              </div>
              <Badge variant="destructive" className="text-lg px-4 py-2">
                Trial Expired
              </Badge>
            </>
          ) : (
            <>
              <div className="text-muted-foreground">
                You have access to all Propeller features during your free trial.
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
              </Badge>
            </>
          )}
          
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={handleUpgradeNow} className="w-full">
              Upgrade Now
            </Button>
            {!trialExpired && (
              <Button variant="outline" onClick={onDismiss} className="w-full">
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FreeTrialModal;