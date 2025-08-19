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
import { createAirBudgetTransaction } from "@/utils/airbudget";
import { AirBudgetCostSummary } from "@/components/AirBudgetCostSummary";
import { AircraftHoursSection } from "@/components/AircraftHoursSection";

const flightSchema = z.object({
  aircraft_id: z.string().min(1, "Aircraft selection is required"),
  flight_date: z.date(),
  departure: z.string().min(1, "Departure is required"),
  arrival: z.string().min(1, "Arrival is required"),
  flight_details: z.string().optional(),
  flight_rules: z.enum(["VFR", "IFR"]),
  flight_type: z.enum(["Local", "Cross Country"]),
  day_night: z.enum(["Day", "Night"]),
  flight_time: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0).optional()
  ),
  instrument_actual: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0).optional()
  ),
  instrument_simulated: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0).optional()
  ),
  instrument_ground: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0).optional()
  ),
  takeoffs: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    },
    z.number().min(0)
  ),
  precision_approaches: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    },
    z.number().min(0)
  ),
  non_precision_approaches: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    },
    z.number().min(0)
  ),
  landings: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    },
    z.number().min(0)
  ),
  aircraft_hobbs_end: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0).optional()
  ),
  aircraft_tacho_end: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0).optional()
  ),
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
  cost_per_hour?: number;
  export_to_airbudget: boolean;
  track_hobbs_tacho?: boolean;
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

// Helper function to convert time string to decimal hours and round up to 1 decimal place
const timeStringToDecimal = (timeString: string): number => {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const decimalHours = hours + (minutes / 60) + (seconds / 3600);
  return Math.ceil(decimalHours * 10) / 10; // Round up to 1 decimal place
};

const SaveFlight = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [flightCrew, setFlightCrew] = useState<FlightCrewAssignment[]>([]);
  const [crewDialogOpen, setCrewDialogOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [newCrewMember, setNewCrewMember] = useState({ crew_member_id: "", role: "", is_self: true });
  const [currentFlightId, setCurrentFlightId] = useState<string | null>(null);

  const form = useForm<FlightFormData>({
    resolver: zodResolver(flightSchema),
    defaultValues: {
      flight_rules: "VFR",
      flight_type: "Local", 
      day_night: "Day",
      takeoffs: 0,
      precision_approaches: 0,
      non_precision_approaches: 0,
      landings: 0,
    },
  });

  useEffect(() => {
    loadData();
    loadFlightData();
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

  const loadFlightData = async () => {
    try {
      const flightId = sessionStorage.getItem('currentFlightId');
      if (!flightId) {
        navigate('/new-flight');
        return;
      }

      setCurrentFlightId(flightId);

      // Load the incomplete flight from database
      const { data: flight, error: flightError } = await supabase
        .from('flights')
        .select(`
          *,
          flight_crew (
            *,
            crew_member:crew (
              id,
              first_name,
              last_name
            )
          )
        `)
        .eq('id', flightId)
        .eq('status', 'incomplete')
        .single();

      if (flightError) {
        console.error('Error loading flight:', flightError);
        navigate('/new-flight');
        return;
      }

      if (flight) {
        // Pre-populate form with flight data
        form.setValue("aircraft_id", flight.aircraft_id);
        form.setValue("departure", flight.departure);
        form.setValue("arrival", flight.arrival);
        form.setValue("flight_date", new Date(flight.flight_date));

        // Pre-populate timing data from session storage
        const storedFlightTime = sessionStorage.getItem('flightTime');
        const storedImcTime = sessionStorage.getItem('imcTime');
        
        if (storedFlightTime) {
          const flightTimeDecimal = timeStringToDecimal(storedFlightTime);
          form.setValue("flight_time", flightTimeDecimal);
        }
        
        if (storedImcTime && storedImcTime !== "00:00:00") {
          const imcTimeDecimal = timeStringToDecimal(storedImcTime);
          form.setValue("instrument_actual", imcTimeDecimal);
        }

        // Pre-populate crew data if available
        if (flight.flight_crew && flight.flight_crew.length > 0) {
          const crewData = flight.flight_crew.map((fc: any) => ({
            crew_member_id: fc.crew_member_id,
            is_self: fc.is_self,
            role: fc.role,
            crew_member: fc.crew_member
          }));
          setFlightCrew(crewData);
        }

        // Clear the session storage after loading
        sessionStorage.removeItem('currentFlightId');
        sessionStorage.removeItem('flightTime');
        sessionStorage.removeItem('imcTime');
      }
    } catch (error) {
      console.error("Error loading flight data:", error);
      navigate('/new-flight');
    }
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

  const isSelfUsed = (): boolean => {
    return flightCrew.some(fc => fc.is_self);
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

  const onSubmit = async (data: FlightFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch country codes for departure and arrival airports
      const [departureAirport, arrivalAirport] = await Promise.all([
        supabase
          .from('airport_ident')
          .select('iso_country')
          .eq('ident', data.departure.toUpperCase())
          .single(),
        supabase
          .from('airport_ident')
          .select('iso_country')
          .eq('ident', data.arrival.toUpperCase())
          .single()
      ]);

      const departureCountryCode = departureAirport.data?.iso_country || null;
      const arrivalCountryCode = arrivalAirport.data?.iso_country || null;

      if (currentFlightId) {
        // Update existing incomplete flight
        const flightData = {
          flight_details: data.flight_details,
          flight_rules: data.flight_rules,
          flight_type: data.flight_type,
          day_night: data.day_night,
          flight_time: data.flight_time,
          instrument_actual: data.instrument_actual,
          instrument_simulated: data.instrument_simulated,
          instrument_ground: data.instrument_ground,
          takeoffs: data.takeoffs,
          precision_approaches: data.precision_approaches,
          non_precision_approaches: data.non_precision_approaches,
          landings: data.landings,
          aircraft_hobbs_end: data.aircraft_hobbs_end,
          aircraft_tacho_end: data.aircraft_tacho_end,
          departure_country_code: departureCountryCode,
          arrival_country_code: arrivalCountryCode,
          status: 'complete'
        };

        const { error: flightError } = await supabase
          .from("flights")
          .update(flightData)
          .eq('id', currentFlightId);

        if (flightError) throw flightError;

        // Update aircraft hours if provided
        if (data.aircraft_hobbs_end || data.aircraft_tacho_end) {
          const updateData: any = {};
          if (data.aircraft_hobbs_end) updateData.hobbs_time = data.aircraft_hobbs_end;
          if (data.aircraft_tacho_end) updateData.tacho_time = data.aircraft_tacho_end;

          const { error: aircraftError } = await supabase
            .from("aircraft")
            .update(updateData)
            .eq("id", data.aircraft_id);

          if (aircraftError) throw aircraftError;
        }
      } else {
        // Create new flight (fallback)
        const flightData = {
          aircraft_id: data.aircraft_id,
          flight_date: data.flight_date.toISOString().split('T')[0],
          departure: data.departure,
          arrival: data.arrival,
          flight_details: data.flight_details,
          flight_rules: data.flight_rules,
          flight_type: data.flight_type,
          day_night: data.day_night,
          flight_time: data.flight_time,
          instrument_actual: data.instrument_actual,
          instrument_simulated: data.instrument_simulated,
          instrument_ground: data.instrument_ground,
          takeoffs: data.takeoffs,
          precision_approaches: data.precision_approaches,
          non_precision_approaches: data.non_precision_approaches,
          landings: data.landings,
          aircraft_hobbs_end: data.aircraft_hobbs_end,
          aircraft_tacho_end: data.aircraft_tacho_end,
          departure_country_code: departureCountryCode,
          arrival_country_code: arrivalCountryCode,
          user_id: user.id,
          aircraft_hobbs_start: selectedAircraft?.hobbs_time,
          aircraft_tacho_start: selectedAircraft?.tacho_time,
          status: 'complete'
        };

        const { data: flight, error: flightError } = await supabase
          .from("flights")
          .insert(flightData)
          .select()
          .single();

        if (flightError) throw flightError;

        // Create flight crew assignments
        if (flightCrew.length > 0) {
          const crewAssignments = flightCrew.map(fc => ({
            flight_id: flight.id,
            crew_member_id: fc.is_self ? null : fc.crew_member_id,
            is_self: fc.is_self,
            role: fc.role,
          }));

          const { error: crewError } = await supabase
            .from("flight_crew")
            .insert(crewAssignments);

          if (crewError) throw crewError;
        }

      // Update aircraft hours if provided
      if (data.aircraft_hobbs_end || data.aircraft_tacho_end) {
        const updateData: any = {};
        if (data.aircraft_hobbs_end) updateData.hobbs_time = data.aircraft_hobbs_end;
        if (data.aircraft_tacho_end) updateData.tacho_time = data.aircraft_tacho_end;

        const { error: aircraftError } = await supabase
          .from("aircraft")
          .update(updateData)
          .eq("id", data.aircraft_id);

        if (aircraftError) throw aircraftError;
      }
      }

      // Create AirBudget transaction if aircraft has export enabled
      if (selectedAircraft && data.flight_time) {
        try {
          await createAirBudgetTransaction(
            {
              flight_date: data.flight_date.toISOString().split('T')[0],
              departure: data.departure,
              arrival: data.arrival,
              flight_time: data.flight_time,
              aircraft_id: data.aircraft_id
            },
            selectedAircraft
          );
        } catch (airbudgetError) {
          console.error("AirBudget transaction failed:", airbudgetError);
          // Don't prevent flight save from completing
        }
      }

      toast({
        title: "Success",
        description: "Flight saved successfully",
      });

      navigate("../logbook");
    } catch (error) {
      console.error("Error saving flight:", error);
      toast({
        title: "Error",
        description: "Failed to save flight",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlight = async () => {
    if (!currentFlightId) return;
    
    try {
      setLoading(true);

      // Delete flight crew assignments first (due to foreign key constraints)
      const { error: crewError } = await supabase
        .from('flight_crew')
        .delete()
        .eq('flight_id', currentFlightId);

      if (crewError) throw crewError;

      // Delete the incomplete flight
      const { error: flightError } = await supabase
        .from('flights')
        .delete()
        .eq('id', currentFlightId)
        .eq('status', 'incomplete');

      if (flightError) throw flightError;

      toast({
        title: "Success",
        description: "Flight deleted successfully",
      });

      navigate("../logbook");
    } catch (error) {
      console.error("Error deleting flight:", error);
      toast({
        title: "Error",
        description: "Failed to delete flight",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const roles = ["Pilot in Command", "Instructor", "Student", "Co-Pilot"];
  const availableRoles = roles.filter(role => !getUsedRoles().includes(role));
  const availableCrewMembers = crew.filter(c => !getUsedCrewMembers().includes(c.id));

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
      <h1 className="text-3xl font-bold mb-8">Save Flight</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    <div className="flex flex-col md:flex-row gap-4">
                      {selectedAircraft.aircraft_photo_url && (
                        <div className="flex-shrink-0">
                          <img 
                            src={selectedAircraft.aircraft_photo_url} 
                            alt={`${selectedAircraft.manufacturer} ${selectedAircraft.model}`}
                            className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <Label className="text-muted-foreground">Type</Label>
                            <p className="font-medium">{selectedAircraft.aircraft_type}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Category</Label>
                            <p className="font-medium">{selectedAircraft.category}</p>
                          </div>
                          {selectedAircraft.track_hobbs_tacho && selectedAircraft.hobbs_time && (
                            <div>
                              <Label className="text-muted-foreground">Hobbs Time</Label>
                              <p className="font-medium">{selectedAircraft.hobbs_time.toFixed(1)}</p>
                            </div>
                          )}
                          {selectedAircraft.track_hobbs_tacho && selectedAircraft.tacho_time && (
                            <div>
                              <Label className="text-muted-foreground">Tacho Time</Label>
                              <p className="font-medium">{selectedAircraft.tacho_time.toFixed(2)}</p>
                            </div>
                          )}
                        </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure</FormLabel>
                      <FormControl>
                        <Input placeholder="KJFK" {...field} />
                      </FormControl>
                      <FormMessage />
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
                        <Input placeholder="KLGA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="flight_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Flight Date</FormLabel>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
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
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="VFR">VFR</SelectItem>
                          <SelectItem value="IFR">IFR</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Local">Local</SelectItem>
                          <SelectItem value="Cross Country">Cross Country</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="day_night"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day/Night</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Day">Day</SelectItem>
                          <SelectItem value="Night">Night</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="flight_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flight Details (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any additional flight details, notes, or comments..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Crew Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Crew
                <Dialog open={crewDialogOpen} onOpenChange={setCrewDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Crew Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Crew Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={newCrewMember.role} onValueChange={(value) => setNewCrewMember({...newCrewMember, role: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is-self"
                          checked={newCrewMember.is_self}
                          onCheckedChange={(checked) => setNewCrewMember({...newCrewMember, is_self: checked, crew_member_id: checked ? "" : newCrewMember.crew_member_id})}
                        />
                        <Label htmlFor="is-self">This is me</Label>
                      </div>

                      {!newCrewMember.is_self && (
                        <div>
                          <Label htmlFor="crew-member">Crew Member</Label>
                          <Select value={newCrewMember.crew_member_id} onValueChange={(value) => setNewCrewMember({...newCrewMember, crew_member_id: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select crew member" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCrewMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.first_name} {member.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setCrewDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddCrew} disabled={!newCrewMember.role || (!newCrewMember.is_self && !newCrewMember.crew_member_id)}>
                          Add
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {flightCrew.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No crew members added yet</p>
              ) : (
                <div className="space-y-2">
                  {flightCrew.map((fc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{fc.role}</p>
                        <p className="text-sm text-muted-foreground">
                          {fc.is_self ? "You" : `${fc.crew_member?.first_name} ${fc.crew_member?.last_name}`}
                        </p>
                      </div>
                      <Button
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

          {/* Flight Hours Section */}
          <Card>
            <CardHeader>
              <CardTitle>Flight Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="flight_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flight Time (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="0.0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instrument_actual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrument - Actual</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="0.0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instrument_simulated"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrument - Simulated</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="0.0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instrument_ground"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrument - Ground</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="0.0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Aircraft Hours Section */}
          <AircraftHoursSection
            aircraft={selectedAircraft}
            form={form}
            flightTime={form.watch("flight_time")}
            hobbsFieldName="aircraft_hobbs_end"
            tachoFieldName="aircraft_tacho_end"
          />

          {/* Take-offs, Approaches & Landings Section */}
          <Card>
            <CardHeader>
              <CardTitle>Take-offs, Approaches & Landings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="takeoffs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Takeoffs</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="landings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Landings</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="precision_approaches"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precision Approaches</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="non_precision_approaches"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Non-Precision Approaches</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>


          {/* AirBudget Cost Summary */}
          <AirBudgetCostSummary 
            aircraft={selectedAircraft} 
            flightTime={form.watch("flight_time")} 
          />

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteFlight}
              disabled={loading || !currentFlightId}
            >
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("../logbook")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Flight"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SaveFlight;