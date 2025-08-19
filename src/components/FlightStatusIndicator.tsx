import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Eye } from "lucide-react";
import { useFlightContext } from "@/contexts/FlightContext";

const FlightStatusIndicator = () => {
  const {
    isFlightActive,
    flightData,
    isModalVisible,
    flightTime,
    currentTank,
    toggleModalVisibility,
  } = useFlightContext();

  if (!isFlightActive || !flightData) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Badge variant="default" className="flex items-center gap-2">
        <Plane className="h-3 w-3" />
        <span className="font-mono text-xs">{flightTime}</span>
      </Badge>
      
      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
        <span>{flightData.route.departure} → {flightData.route.arrival}</span>
        <span>•</span>
        <span>{currentTank}</span>
      </div>

      {!isModalVisible && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleModalVisibility}
          className="h-8 px-2"
        >
          <Eye className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">View</span>
        </Button>
      )}
    </div>
  );
};

export default FlightStatusIndicator;