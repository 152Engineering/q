import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const LicensesRatingsEndorsements = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("../tools")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tools
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-6">Licenses, Ratings & Endorsements</h1>
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">
            License and rating management coming soon...
          </p>
        </div>
      </div>
  );
};

export default LicensesRatingsEndorsements;