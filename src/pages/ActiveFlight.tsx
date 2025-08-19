import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Fuel, MapPin, Plane } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const ActiveFlight = () => {
  const [flightTime, setFlightTime] = useState("00:00:00");
  const [currentTank, setCurrentTank] = useState("Left Tank");
  const [leftFuel, setLeftFuel] = useState(85);
  const [rightFuel, setRightFuel] = useState(82);

  useEffect(() => {
    // Simulate flight time counter
    const interval = setInterval(() => {
      const now = new Date();
      const startTime = new Date(now.getTime() - (Math.random() * 3600000)); // Random flight time
      const elapsed = now.getTime() - startTime.getTime();
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setFlightTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Active Flight</h1>
          <Badge variant="default" className="text-lg px-4 py-2">
            <Plane className="h-5 w-5 mr-2" />
            In Progress
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Flight Time */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flight Time</CardTitle>
              <Clock className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flightTime}</div>
            </CardContent>
          </Card>

          {/* Current Route */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Route</CardTitle>
              <MapPin className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">NZCH → NZWS</div>
            </CardContent>
          </Card>
        </div>

        {/* Fuel Management */}
        <Card className="mb-8">
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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Left Tank</span>
                  <span className="text-sm text-muted-foreground">{leftFuel}L</span>
                </div>
                <Progress value={leftFuel} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Right Tank</span>
                  <span className="text-sm text-muted-foreground">{rightFuel}L</span>
                </div>
                <Progress value={rightFuel} className="h-2" />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Next tank change in <strong>7 minutes</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Aircraft Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Aircraft Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Tail Number:</span>
                <div>ZK-ABC</div>
              </div>
              <div>
                <span className="font-medium">Type:</span>
                <div>C172</div>
              </div>
              <div>
                <span className="font-medium">Hobbs Start:</span>
                <div>1234.5</div>
              </div>
              <div>
                <span className="font-medium">Current Hobbs:</span>
                <div>1235.8</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" size="lg">
            Pause Flight
          </Button>
          <Button variant="destructive" size="lg">
            End Flight
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ActiveFlight;