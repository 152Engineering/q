import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Fuel, MapPin, Plane, Minimize2, Maximize2, X, Cloud, Play, Pause, RotateCcw } from "lucide-react";
import { useFlightContext } from "@/contexts/FlightContext";
import { cn } from "@/lib/utils";

const ActiveFlightModal = () => {
  const {
    isFlightActive,
    flightData,
    isModalVisible,
    isModalMinimized,
    flightTime,
    currentTank,
    leftFuel,
    rightFuel,
    fuelCapacity,
    nextTankChangeMinutes,
    nextTankChangeSeconds,
    isTankChangeOverdue,
    tankChangeOverdueDuration,
    imcTime,
    isImcActive,
    endFlight,
    toggleModalVisibility,
    toggleModalMinimized,
    switchTank,
    startImcTimer,
    pauseImcTimer,
    resetImcTimer,
  } = useFlightContext();

  if (!isFlightActive || !flightData || !isModalVisible) {
    return null;
  }

  return (
    <Dialog open={isModalVisible} onOpenChange={() => {}}>
      <DialogContent 
        className={cn(
          "fixed z-50 transition-all duration-300 [&>button]:hidden",
          isModalMinimized 
            ? "w-80 h-32 bottom-4 right-4 top-auto left-auto transform-none"
            : "w-[90vw] max-w-4xl max-h-[95vh] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-hidden flex flex-col"
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Active Flight
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={isModalMinimized ? toggleModalMinimized : toggleModalVisibility}
              className="h-8 w-8 p-0"
            >
              {isModalMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        {isModalMinimized ? (
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                In Progress
              </Badge>
              <span className="text-sm font-mono">{flightTime}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {flightData.route.departure} → {flightData.route.arrival}
            </div>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto flex-1 min-h-0">
            <div className="flex items-center justify-between gap-4 mb-6">
              <Badge variant="default" className="text-lg px-4 py-2">
                <Plane className="h-5 w-5 mr-2" />
                In Progress
              </Badge>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-lg font-bold">{flightTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {flightData.route.departure} → {flightData.route.arrival}
                  </span>
                </div>
              </div>
            </div>

            <div className={cn(
              "grid gap-6",
              flightData.flightRules === "IFR" ? "grid-cols-1" : "grid-cols-1"
            )}>

              {/* IMC Timer - Only show if IFR */}
              {flightData.flightRules === "IFR" && (
                <Card className={cn(
                  "transition-all duration-200",
                  isImcActive ? "border-primary bg-primary/5 shadow-sm" : ""
                )}>
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <CardTitle className={cn(
                      "text-sm font-medium",
                      isImcActive ? "text-primary font-semibold" : ""
                    )}>
                      IMC Timer
                    </CardTitle>
                    <Cloud className={cn(
                      "h-4 w-4 ml-auto",
                      isImcActive ? "text-primary" : "text-muted-foreground"
                    )} />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className={cn(
                        "text-2xl font-bold font-mono mb-2",
                        isImcActive ? "text-primary" : ""
                      )}>
                        {imcTime}
                      </div>
                      <Badge variant={isImcActive ? "default" : "secondary"} className="text-xs">
                        {isImcActive ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-1 justify-center">
                      {!isImcActive ? (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={startImcTimer}
                          className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                        >
                          <Play className="h-3 w-3" />
                          Start
                        </Button>
                      ) : (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={pauseImcTimer}
                          className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                        >
                          <Pause className="h-3 w-3" />
                          Pause
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetImcTimer}
                        className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Fuel Management - Only show if fuel tracking is enabled */}
            {flightData.fuelTracking?.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Fuel className="h-5 w-5 mr-2" />
                    Fuel Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Current Tank:</span>
                    <Badge variant="outline">{currentTank}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={cn(
                      "space-y-2 p-3 rounded-lg border transition-all duration-200",
                      (currentTank === "Left Tank" || currentTank === "Both")
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border"
                    )}>
                      <div className="flex justify-between">
                        <span className={cn(
                          "text-sm font-medium",
                          (currentTank === "Left Tank" || currentTank === "Both") ? "text-primary font-semibold" : ""
                        )}>
                          Left Tank {currentTank === "Left Tank" && "• ACTIVE"} {currentTank === "Both" && "• ACTIVE"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {leftFuel.toFixed(1)}L / {fuelCapacity ? fuelCapacity.toFixed(0) : '0'}L
                        </span>
                      </div>
                      <Progress 
                        value={fuelCapacity ? (leftFuel / fuelCapacity) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>

                    <div className={cn(
                      "space-y-2 p-3 rounded-lg border transition-all duration-200",
                      (currentTank === "Right Tank" || currentTank === "Both")
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border"
                    )}>
                      <div className="flex justify-between">
                        <span className={cn(
                          "text-sm font-medium",
                          (currentTank === "Right Tank" || currentTank === "Both") ? "text-primary font-semibold" : ""
                        )}>
                          Right Tank {currentTank === "Right Tank" && "• ACTIVE"} {currentTank === "Both" && "• ACTIVE"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {rightFuel.toFixed(1)}L / {fuelCapacity ? fuelCapacity.toFixed(0) : '0'}L
                        </span>
                      </div>
                      <Progress 
                        value={fuelCapacity ? (rightFuel / fuelCapacity) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>

                  {/* Only show tank switching controls if tank select is enabled */}
                  {flightData.fuelTracking?.tankSelectEnabled && currentTank !== "Both" && (
                    <>
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={switchTank}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white"
                        >
                          Switch Tank
                        </Button>
                      </div>

                      <div className={cn(
                        "p-4 rounded-lg transition-all duration-200",
                        isTankChangeOverdue
                          ? tankChangeOverdueDuration > 30000
                            ? "bg-red-500 border border-red-600 text-white animate-pulse"
                            : "bg-red-100 border border-red-300 text-red-800"
                          : nextTankChangeMinutes <= 1 
                            ? "bg-orange-100 border border-orange-300 text-orange-800" 
                            : "bg-muted"
                      )}>
                        <p className={cn(
                          "text-sm font-bold",
                          isTankChangeOverdue
                            ? tankChangeOverdueDuration > 30000
                              ? "text-white"
                              : "text-red-800"
                            : nextTankChangeMinutes <= 1 
                              ? "text-orange-800" 
                              : "text-muted-foreground"
                        )}>
                          {isTankChangeOverdue 
                            ? tankChangeOverdueDuration > 30000
                              ? "⚠️ TANK CHANGE OVERDUE - Switch tanks now!"
                              : "Tank change due - Please switch tanks"
                            : `Next tank change in ${nextTankChangeMinutes}:${nextTankChangeSeconds.toString().padStart(2, '0')}`
                          }
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Control Buttons */}
            <div className="flex justify-center gap-4">
              <Button variant="destructive" size="lg" onClick={endFlight}>
                End Flight
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActiveFlightModal;