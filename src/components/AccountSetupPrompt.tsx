import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AccountSetupPrompt = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-amber-900 dark:text-amber-100">
            Complete Your Account Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-amber-800 dark:text-amber-200">
            To access your dashboard and start using AirLogs, please complete your profile in Account Settings.
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            We need a few details like your timezone, date format, currency preference, and pilot license information to provide you with the best experience.
          </p>
          <Button 
            onClick={() => navigate('/settings?tab=pilot-details')}
            className="mt-6"
          >
            <Settings className="h-4 w-4 mr-2" />
            Complete Profile Setup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSetupPrompt;