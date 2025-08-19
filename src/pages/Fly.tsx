import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Plane, X, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AirportInput } from "@/components/ui/airport-input";
import { AirportInfo } from "@/components/ui/airport-info";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFlightContext } from "@/contexts/FlightContext";

const flightSchema = z.object({
  aircraft_id: z.string().min(1, "Aircraft selection is required"),
  flight_date: z.date(),
  departure: z.string().min(1, "Departure is required"),
  arrival: z.string().min(1, "Arrival is required"),
  flight_details: z.string().optional(),
  flight_rules: z.enum(["VFR", "IFR"]),
  flight_type: z.enum(["Local", "Cross Country"]),
  day_night: z.enum(["Day", "Night"]),
});

type FlightFormData = z.infer<typeof flightSchema>;

interface Aircraft {
  id: string;
  tail_number: string;
  aircraft_type: string;
  manufacturer: string;
  model: string;
  category: string;
  hobbs_time?: number;
  tacho_time?: number;
  aircraft_photo_url?: string;
  fuel_tank_capacity?: number;
  average_fuel_burn?: number;
}

interface CrewMember {
  id: string;
  first_name: string;
  last_name: string;
}

interface FlightCrewAssignment {
  crew_member_id?: string;
  is_self: boolean;
  role: string;
  crew_member?: CrewMember;
}

interface AirportDetails {
  id: string;
  ident: string;
  name: string | null;
  type: string | null;
  iso_country: string | null;
  elevation_ft: number | null;
}

const Fly = () => {
  const navigate = useNavigate();
  const { startFlight } = useFlightContext();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [flightCrew, setFlightCrew] = useState<FlightCrewAssignment[]>([]);
  const [crewDialogOpen, setCrewDialogOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [newCrewMember, setNewCrewMember] = useState({ crew_member_id: "", role: "", is_self: true });
  const [fuelTrackingEnabled, setFuelTrackingEnabled] = useState(false);
  const [leftTankFuel, setLeftTankFuel] = useState("");
  const [rightTankFuel, setRightTankFuel] = useState("");
  const [tankSelectEnabled, setTankSelectEnabled] = useState(false);
  const [changeFrequency, setChangeFrequency] = useState(10);
  const [startingTank, setStartingTank] = useState("Left Tank");
  const [userVolumeUnit, setUserVolumeUnit] = useState<string>("Liters");
  const [fuelCapacity, setFuelCapacity] = useState("");
  const [averageFuelBurn, setAverageFuelBurn] = useState("");
  const [savingAircraftData, setSavingAircraftData] = useState(false);
  const [departureAirport, setDepartureAirport] = useState<AirportDetails | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<AirportDetails | null>(null);

  const form = useForm<FlightFormData>({
    resolver: zodResolver(flightSchema),
    defaultValues: {
      flight_date: new Date(),
      flight_rules: "VFR",
      flight_type: "Local", 
      day_night: "Day",
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const selectedAircraftId = form.watch("aircraft_id");
    if (selectedAircraftId) {
      const aircraft = findAircraftById(selectedAircraftId);
      setSelectedAircraft(aircraft);
    } else {
      setSelectedAircraft(null);
    }
  }, [form.watch("aircraft_id")]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user profile for volume unit
      const { data: profile } = await supabase
        .from("profiles")
        .select("volume_unit")
        .eq("user_id", user.id)
        .single();

      if (profile?.volume_unit) {
        setUserVolumeUnit(profile.volume_unit);
      }

      // Load aircraft
      const { data: aircraftData, error: aircraftError } = await supabase
        .from("aircraft")
        .select("*")
        .eq("user_id", user.id)
        .order("tail_number");

      if (aircraftError) throw aircraftError;
      setAircraft(aircraftData || []);

      // Load crew
      const { data: crewData, error: crewError } = await supabase
        .from("crew")
        .select("*")
        .eq("user_id", user.id)
        .order("first_name");

      if (crewError) throw crewError;
      setCrew(crewData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  const findAircraftById = (id: string): Aircraft | null => {
    return aircraft.find(a => a.id === id) || null;
  };

  const getUsedRoles = (): string[] => {
    return flightCrew.map(fc => fc.role);
  };

  const getUsedCrewMembers = (): string[] => {
    return flightCrew
      .filter(fc => !fc.is_self && fc.crew_member_id)
      .map(fc => fc.crew_member_id!);
  };

  const handleAddCrew = () => {
    if (!newCrewMember.role) return;

    const assignment: FlightCrewAssignment = {
      role: newCrewMember.role,
      is_self: newCrewMember.is_self,
    };

    if (!newCrewMember.is_self && newCrewMember.crew_member_id) {
      assignment.crew_member_id = newCrewMember.crew_member_id;
      assignment.crew_member = crew.find(c => c.id === newCrewMember.crew_member_id);
    }

    setFlightCrew([...flightCrew, assignment]);
    setNewCrewMember({ crew_member_id: "", role: "", is_self: true });
    setCrewDialogOpen(false);
  };

  const handleRemoveCrew = (index: number) => {
    const updatedCrew = flightCrew.filter((_, i) => i !== index);
    setFlightCrew(updatedCrew);
  };

  const roles = ["Pilot in Command", "Instructor", "Student", "Co-Pilot"];
  const availableRoles = roles.filter(role => !getUsedRoles().includes(role));
  const availableCrewMembers = crew.filter(c => !getUsedCrewMembers().includes(c.id));

  
  const handleSaveAircraftData = async () => {
    if (!selectedAircraft || !fuelCapacity || !averageFuelBurn) {
      toast({
        title: "Error",
        description: "Please fill in both fuel tank capacity and average fuel burn",
        variant: "destructive",
      });
      return;
    }

    setSavingAircraftData(true);
    try {
      const { error } = await supabase
        .from("aircraft")
        .update({
          fuel_tank_capacity: parseFloat(fuelCapacity),
          average_fuel_burn: parseFloat(averageFuelBurn),
        })
        .eq("id", selectedAircraft.id);

      if (error) throw error;

      // Update the local aircraft state and selected aircraft
      const updatedAircraft = aircraft.map(a => 
        a.id === selectedAircraft.id 
          ? { 
              ...a, 
              fuel_tank_capacity: parseFloat(fuelCapacity), 
              average_fuel_burn: parseFloat(averageFuelBurn) 
            }
          : a
      );
      setAircraft(updatedAircraft);
      
      // Update selected aircraft
      const updatedSelectedAircraft = {
        ...selectedAircraft,
        fuel_tank_capacity: parseFloat(fuelCapacity),
        average_fuel_burn: parseFloat(averageFuelBurn),
      };
      setSelectedAircraft(updatedSelectedAircraft);

      // Clear the input fields
      setFuelCapacity("");
      setAverageFuelBurn("");

      toast({
        title: "Success",
        description: `Aircraft data saved for ${selectedAircraft.tail_number}`,
      });
    } catch (error) {
      console.error("Error saving aircraft data:", error);
      toast({
        title: "Error",
        description: "Failed to save aircraft data",
        variant: "destructive",
      });
    } finally {
      setSavingAircraftData(false);
    }
  };

  const handleStartFlight = () => {
    const formData = form.getValues();
    
    if (!selectedAircraft) {
      toast({
        title: "Error",
        description: "Please select an aircraft",
        variant: "destructive",
      });
      return;
    }

    if (!formData.departure || !formData.arrival) {
      toast({
        title: "Error", 
        description: "Please fill in departure and arrival airports",
        variant: "destructive",
      });
      return;
    }

    if (!formData.flight_date) {
      toast({
        title: "Error",
        description: "Please select a flight date",
        variant: "destructive",
      });
      return;
    }

    // Check if fuel tracking is enabled but required aircraft data is missing
    if (fuelTrackingEnabled && selectedAircraft) {
      const missingFields = [];
      if (!selectedAircraft.fuel_tank_capacity) {
        missingFields.push("fuel tank capacity");
      }
      if (!selectedAircraft.average_fuel_burn) {
        missingFields.push("average fuel burn rate");
      }
      
      if (missingFields.length > 0) {
        toast({
          title: "Missing Aircraft Data",
          description: `Please add ${missingFields.join(" and ")} for ${selectedAircraft.tail_number} in Aircraft settings to enable fuel tracking.`,
          variant: "destructive",
        });
        return;
      }
    }

    const flightData: any = {
      aircraftId: selectedAircraft.id,
      aircraftInfo: {
        tailNumber: selectedAircraft.tail_number,
        type: selectedAircraft.aircraft_type,
        hobbsStart: selectedAircraft.hobbs_time || 0,
        fuelCapacity: selectedAircraft.fuel_tank_capacity,
        fuelBurnRate: selectedAircraft.average_fuel_burn || 0,
      },
      route: {
        departure: formData.departure,
        arrival: formData.arrival,
      },
      flightDate: formData.flight_date,
      startTime: new Date(),
      flightRules: formData.flight_rules,
    };

    // Add fuel tracking data if enabled
    if (fuelTrackingEnabled) {
      flightData.fuelTracking = {
        enabled: true,
        leftTankStart: parseFloat(leftTankFuel) || 0,
        rightTankStart: parseFloat(rightTankFuel) || 0,
        startingTank: tankSelectEnabled ? startingTank : "Both",
        changeFrequency: changeFrequency,
        tankSelectEnabled: tankSelectEnabled,
      };
    }

    // Add crew data
    if (flightCrew.length > 0) {
      flightData.crew = flightCrew;
    }

    startFlight(flightData);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("../logbook")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Logbook
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-8">Fly</h1>

        <Form {...form}>
          <div className="space-y-8">
            {/* Aircraft Section */}
            <Card>
              <CardHeader>
                <CardTitle>Aircraft</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="aircraft_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Aircraft</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an aircraft" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {aircraft.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.tail_number} - {a.manufacturer} {a.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedAircraft && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        {selectedAircraft.aircraft_photo_url ? (
                          <img 
                            src={selectedAircraft.aircraft_photo_url} 
                            alt={selectedAircraft.tail_number}
                            className="w-24 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-24 h-16 bg-muted flex items-center justify-center rounded">
                            <Plane className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 flex-1 text-sm">
                          <div><strong>Tail Number:</strong> {selectedAircraft.tail_number}</div>
                          <div><strong>Type:</strong> {selectedAircraft.aircraft_type}</div>
                          <div><strong>Manufacturer:</strong> {selectedAircraft.manufacturer}</div>
                          <div><strong>Model:</strong> {selectedAircraft.model}</div>
                          <div className="col-span-2"><strong>Category:</strong> {selectedAircraft.category}</div>
                          {selectedAircraft.hobbs_time && (
                            <div><strong>Hobbs Hours:</strong> {selectedAircraft.hobbs_time.toFixed(1)}</div>
                          )}
                          {selectedAircraft.tacho_time && (
                            <div><strong>Tacho Hours:</strong> {selectedAircraft.tacho_time.toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Flight Details Section */}
            <Card>
              <CardHeader>
                <CardTitle>Flight Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="flight_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-[240px] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setDatePickerOpen(false);
                            }}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure</FormLabel>
                        <FormControl>
                          <AirportInput 
                            {...field} 
                            placeholder="Departure Airport Code"
                            onAirportFound={setDepartureAirport}
                          />
                        </FormControl>
                        <FormMessage />
                        <AirportInfo airport={departureAirport} label="Departure Airport" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="arrival"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arrival</FormLabel>
                        <FormControl>
                          <AirportInput 
                            {...field} 
                            placeholder="Arrival Airport Code"
                            onAirportFound={setArrivalAirport}
                          />
                        </FormControl>
                        <FormMessage />
                        <AirportInfo airport={arrivalAirport} label="Arrival Airport" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="flight_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flight Details</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe the flight..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="flight_rules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flight Rules</FormLabel>
                        <div className="flex items-center space-x-2 min-w-0">
                          <Label htmlFor="vfr-switch" className="whitespace-nowrap">VFR</Label>
                          <Switch
                            id="vfr-switch"
                            checked={field.value === "IFR"}
                            onCheckedChange={(checked) => field.onChange(checked ? "IFR" : "VFR")}
                          />
                          <Label htmlFor="vfr-switch" className="whitespace-nowrap">IFR</Label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="flight_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flight Type</FormLabel>
                        <div className="flex items-center space-x-2 min-w-0">
                          <Label htmlFor="local-switch" className="whitespace-nowrap">Local</Label>
                          <Switch
                            id="local-switch"
                            checked={field.value === "Cross Country"}
                            onCheckedChange={(checked) => field.onChange(checked ? "Cross Country" : "Local")}
                          />
                          <Label htmlFor="local-switch" className="whitespace-nowrap">Cross Country</Label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="day_night"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time of Day</FormLabel>
                        <div className="flex items-center space-x-2 min-w-0">
                          <Label htmlFor="day-switch" className="whitespace-nowrap">Day</Label>
                          <Switch
                            id="day-switch"
                            checked={field.value === "Night"}
                            onCheckedChange={(checked) => field.onChange(checked ? "Night" : "Day")}
                          />
                          <Label htmlFor="day-switch" className="whitespace-nowrap">Night</Label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Crew Details Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  Crew Details
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      type="button"
                      onClick={() => {
                        setFlightCrew(prev => {
                          const selfExists = prev.some(crew => crew.is_self && crew.role === "Pilot in Command");
                          if (selfExists) return prev;
                          return [...prev, { crew_member_id: "", role: "Pilot in Command", is_self: true }];
                        });
                      }}
                    >
                       Add Self as PiC
                    </Button>
                     <Dialog open={crewDialogOpen} onOpenChange={(open) => {
                       setCrewDialogOpen(open);
                       if (open) {
                         setNewCrewMember({ crew_member_id: "", role: "", is_self: true });
                       }
                     }}>
                       <DialogTrigger asChild>
                         <Button variant="outline" size="sm">
                           <Plus className="h-4 w-4 mr-2" />
                           Add Crew
                         </Button>
                       </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Crew Member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Crew Member</Label>
                            <div className="flex items-center space-x-2 mt-2">
                              <Label htmlFor="self-switch">Self</Label>
                              <Switch
                                id="self-switch"
                                checked={!newCrewMember.is_self}
                                onCheckedChange={(checked) => {
                                  setNewCrewMember(prev => ({
                                    ...prev,
                                    is_self: !checked,
                                    crew_member_id: checked ? prev.crew_member_id : ""
                                  }));
                                }}
                              />
                              <Label htmlFor="self-switch">Crew Member</Label>
                            </div>
                          </div>

                          {!newCrewMember.is_self && (
                            <div>
                              <Label>Select Crew Member</Label>
                              <Select
                                value={newCrewMember.crew_member_id}
                                onValueChange={(value) => setNewCrewMember(prev => ({ ...prev, crew_member_id: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select crew member" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCrewMembers.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.first_name} {c.last_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div>
                            <Label>Role</Label>
                            <Select
                              value={newCrewMember.role}
                              onValueChange={(value) => setNewCrewMember(prev => ({ ...prev, role: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableRoles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCrewDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={handleAddCrew}
                              disabled={!newCrewMember.role || (!newCrewMember.is_self && !newCrewMember.crew_member_id)}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {flightCrew.length === 0 ? (
                  <p className="text-muted-foreground">No crew members added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {flightCrew.map((fc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <span className="font-medium">
                            {fc.is_self ? "Self" : `${fc.crew_member?.first_name} ${fc.crew_member?.last_name}`}
                          </span>
                          <span className="text-muted-foreground ml-2">- {fc.role}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCrew(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fuel Tracking Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Fuel Tracking
                  <Switch
                    checked={fuelTrackingEnabled}
                    onCheckedChange={setFuelTrackingEnabled}
                  />
                </CardTitle>
              </CardHeader>
              {fuelTrackingEnabled && (
                <CardContent className="space-y-6">
                  {/* Show warning if aircraft fuel data is missing */}
                  {selectedAircraft && (!selectedAircraft.fuel_tank_capacity || !selectedAircraft.average_fuel_burn) ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="text-amber-600 mt-1">⚠️</div>
                        <div>
                          <h4 className="font-medium text-amber-800 mb-1">Missing Aircraft Information</h4>
                          <p className="text-amber-700 text-sm mb-3">
                            To enable fuel tracking for {selectedAircraft.tail_number}, please add the following information:
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                        {!selectedAircraft.fuel_tank_capacity && (
                          <div>
                            <Label htmlFor="fuel-capacity" className="text-amber-800">
                              Fuel Tank Capacity (per tank, {userVolumeUnit})
                            </Label>
                            <Input
                              id="fuel-capacity"
                              type="number"
                              step="0.1"
                              value={fuelCapacity}
                              onChange={(e) => setFuelCapacity(e.target.value)}
                              placeholder="e.g. 25.0"
                              className="mt-1"
                            />
                          </div>
                        )}
                        
                        {!selectedAircraft.average_fuel_burn && (
                          <div>
                            <Label htmlFor="fuel-burn" className="text-amber-800">
                              Average Fuel Burn ({userVolumeUnit}/hour)
                            </Label>
                            <Input
                              id="fuel-burn"
                              type="number"
                              step="0.1"
                              value={averageFuelBurn}
                              onChange={(e) => setAverageFuelBurn(e.target.value)}
                              placeholder="e.g. 8.5"
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end pl-8">
                        <Button
                          onClick={handleSaveAircraftData}
                          disabled={savingAircraftData || (!fuelCapacity && !selectedAircraft.fuel_tank_capacity) || (!averageFuelBurn && !selectedAircraft.average_fuel_burn)}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          {savingAircraftData ? "Saving..." : "Save Aircraft Data"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="left-tank">Left Tank Fuel ({userVolumeUnit})</Label>
                          <Input
                            id="left-tank"
                            type="number"
                            step="0.1"
                            value={leftTankFuel}
                            onChange={(e) => setLeftTankFuel(e.target.value)}
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="right-tank">Right Tank Fuel ({userVolumeUnit})</Label>
                          <Input
                            id="right-tank"
                            type="number"
                            step="0.1"
                            value={rightTankFuel}
                            onChange={(e) => setRightTankFuel(e.target.value)}
                            placeholder="0.0"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="tank-select">Tank Select</Label>
                          <Switch
                            id="tank-select"
                            checked={tankSelectEnabled}
                            onCheckedChange={setTankSelectEnabled}
                          />
                        </div>

                        {tankSelectEnabled && (
                          <div className="space-y-4 pl-4 border-l-2 border-muted">
                            <div className="flex items-center gap-2">
                              <span>Change tanks every</span>
                              <Input
                                type="number"
                                value={changeFrequency}
                                onChange={(e) => setChangeFrequency(parseInt(e.target.value) || 0)}
                                className="w-20"
                                step="5"
                                min="5"
                                max="99"
                              />
                              <span>minutes.</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Start on</span>
                              <Select value={startingTank} onValueChange={setStartingTank}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Left Tank">Left Tank</SelectItem>
                                  <SelectItem value="Right Tank">Right Tank</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Start Flight Button */}
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                size="lg"
                onClick={handleStartFlight}
                disabled={fuelTrackingEnabled && selectedAircraft && (!selectedAircraft.fuel_tank_capacity || !selectedAircraft.average_fuel_burn)}
                className="px-8 py-4 text-lg"
              >
                Start Flight
              </Button>
            </div>
          </div>
        </Form>
    </div>
  );
};

export default Fly;