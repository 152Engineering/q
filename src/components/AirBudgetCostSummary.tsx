import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, DollarSign } from "lucide-react";

interface Aircraft {
  cost_per_hour?: number | null;
  export_to_airbudget?: boolean;
  tail_number: string;
}

interface AirBudgetCostSummaryProps {
  aircraft: Aircraft | null;
  flightTime: number | undefined;
}

export const AirBudgetCostSummary = ({ aircraft, flightTime }: AirBudgetCostSummaryProps) => {
  // Only show if aircraft has AirBudget export enabled and cost per hour set
  if (!aircraft?.export_to_airbudget || !aircraft?.cost_per_hour || !flightTime) {
    return null;
  }

  const totalCost = aircraft.cost_per_hour * flightTime;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Calculator className="h-5 w-5" />
          AirBudget Expense Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Aircraft:</span>
            <span className="font-medium">{aircraft.tail_number}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Cost per hour:</span>
            <span className="font-medium">${aircraft.cost_per_hour.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Flight time:</span>
            <span className="font-medium">{flightTime.toFixed(1)} hours</span>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total expense to AirBudget:
              </span>
              <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                ${totalCost.toFixed(2)}
              </span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            This expense will be automatically sent to your AirBudget account when you save the flight.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};