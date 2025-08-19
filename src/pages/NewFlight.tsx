import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

interface Airport {
  id: string;
  ident: string;
  name: string | null;
  type: string | null;
  iso_country: string | null;
  elevation_ft: number | null;
}

const NewFlight = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editFlightId = searchParams.get('edit');
  const isEditing = !!editFlightId;
  
  const [loading, setLoading] = useState(false);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [flightCrew, setFlightCrew] = useState<FlightCrewAssignment[]>([]);
  const [crewDialogOpen, setCrewDialogOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [newCrewMember, setNewCrewMember] = useState({ crew_member_id: "", role: "", is_self: true });
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);

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
    if (isEditing && editFlightId) {
      loadFlightData(editFlightId);
    }
  }, [isEditing, editFlightId]);

  useEffect(() => {
    const selectedAircraftId = form.watch("aircraft_id");
    if (selectedAircraftId) {
      const aircraft = findAircraftById(selectedAircraftId);
      setSelectedAircraft(aircraft);
    } else {
      setSelectedAircraft(null);
    }
  }, [form.watch("aircraft_id")]);

  useEffect(() => {
    // Calculate flight time based on hobbs hours
    if (selectedAircraft?.hobbs_time && form.watch("aircraft_hobbs_end")) {
      const startHobbs = selectedAircraft.hobbs_time;
      const endHobbs = form.watch("aircraft_hobbs_end");
      if (endHobbs && endHobbs > startHobbs) {
        const calculatedFlightTime = endHobbs - startHobbs;
        form.setValue("flight_time", calculatedFlightTime);
      }
    }
  }, [selectedAircraft, form.watch("aircraft_hobbs_end")]);

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

  const loadFlightData = async (flightId: string) => {
    try {
      const { data: flightData, error } = await supabase
        .from("flights")
        .select(`
          *,
          flight_crew (
            role,
            is_self,
            crew_member:crew_member_id (
              id,
              first_name,
              last_name
            )
          )
        `)
        .eq("id", flightId)
        .single();

      if (error) throw error;

      // Pre-populate form with flight data
      form.setValue("aircraft_id", flightData.aircraft_id);
      form.setValue("flight_date", new Date(flightData.flight_date));
      form.setValue("departure", flightData.departure);
      form.setValue("arrival", flightData.arrival);
      form.setValue("flight_details", flightData.flight_details || "");
      form.setValue("flight_rules", flightData.flight_rules as "VFR" | "IFR");
      form.setValue("flight_type", flightData.flight_type as "Local" | "Cross Country");
      form.setValue("day_night", flightData.day_night as "Day" | "Night");
      form.setValue("flight_time", flightData.flight_time || undefined);
      form.setValue("instrument_actual", flightData.instrument_actual || undefined);
      form.setValue("instrument_simulated", flightData.instrument_simulated || undefined);
      form.setValue("instrument_ground", flightData.instrument_ground || undefined);
      form.setValue("takeoffs", flightData.takeoffs || 0);
      form.setValue("precision_approaches", flightData.precision_approaches || 0);
      form.setValue("non_precision_approaches", flightData.non_precision_approaches || 0);
      form.setValue("landings", flightData.landings || 0);
      form.setValue("aircraft_hobbs_end", flightData.aircraft_hobbs_end || undefined);
      form.setValue("aircraft_tacho_end", flightData.aircraft_tacho_end || undefined);

      // Set flight crew
      const crewAssignments: FlightCrewAssignment[] = flightData.flight_crew.map((fc: any) => ({
        crew_member_id: fc.crew_member?.id,
        is_self: fc.is_self,
        role: fc.role,
        crew_member: fc.crew_member
      }));
      setFlightCrew(crewAssignments);

    } catch (error) {
      console.error("Error loading flight data:", error);
      toast({
        title: "Error",
        description: "Failed to load flight data",
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

      const baseFlightData = {
        aircraft_id: data.aircraft_id,
        flight_date: data.flight_date.toISOString().split('T')[0],
        departure: data.departure,
        arrival: data.arrival,
        departure_country_code: departureCountryCode,
        arrival_country_code: arrivalCountryCode,
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
      };

      let flightId: string;

      if (isEditing && editFlightId) {
        // Update existing flight
        const { error: flightError } = await supabase
          .from("flights")
          .update(baseFlightData)
          .eq("id", editFlightId);

        if (flightError) throw flightError;
        flightId = editFlightId;

        // Delete existing crew assignments and recreate them
        const { error: deleteCrewError } = await supabase
          .from("flight_crew")
          .delete()
          .eq("flight_id", editFlightId);

        if (deleteCrewError) throw deleteCrewError;
      } else {
        // Create new flight
        const flightData = {
          ...baseFlightData,
          user_id: user.id,
          aircraft_hobbs_start: selectedAircraft?.hobbs_time,
          aircraft_tacho_start: selectedAircraft?.tacho_time,
        };

        const { data: flight, error: flightError } = await supabase
          .from("flights")
          .insert(flightData)
          .select()
          .single();

        if (flightError) throw flightError;
        flightId = flight.id;
      }

      // Create flight crew assignments
      if (flightCrew.length > 0) {
        const crewAssignments = flightCrew.map(fc => ({
          flight_id: flightId,
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

      // Create AirBudget transaction if aircraft has export enabled (only for new flights)
      if (!isEditing && selectedAircraft && data.flight_time) {
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
        description: `Flight ${isEditing ? "updated" : "saved"} successfully`,
      });

      navigate("../logbook");
    } catch (error) {
      console.error("Error saving flight:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "save"} flight`,
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
      <h1 className="text-3xl font-bold mb-8">{isEditing ? "Edit Flight" : "New Flight"}</h1>

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
                          {selectedAircraft.track_hobbs_tacho && selectedAircraft.hobbs_time && (
                            <div><strong>Hobbs Hours:</strong> {selectedAircraft.hobbs_time.toFixed(1)}</div>
                          )}
                          {selectedAircraft.track_hobbs_tacho && selectedAircraft.tacho_time && (
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
                  <span>Crew Details</span>
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

            {/* Flight Hours Section */}
            <Card>
              <CardHeader>
                <CardTitle>Flight Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="flight_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flight Time</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          disabled={selectedAircraft?.hobbs_time !== null && !!form.watch("aircraft_hobbs_end")}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="text-base font-medium">Instrument Time</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <FormField
                      control={form.control}
                      name="instrument_actual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.1"
                              placeholder="0.0"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                          <FormLabel>Simulated</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.1"
                              placeholder="0.0"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                          <FormLabel>Ground</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.1"
                              placeholder="0.0"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Take-offs, Approaches & Landings Section */}
            <Card>
              <CardHeader>
                <CardTitle>Take-offs, Approaches & Landings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="takeoffs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Take-offs</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            placeholder="0"
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
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
                            {...field}
                            type="number"
                            min="0"
                            placeholder="0"
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
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
                            {...field}
                            type="number"
                            min="0"
                            placeholder="0"
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
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
                            {...field}
                            type="number"
                            min="0"
                            placeholder="0"
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
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

            {/* AirBudget Cost Summary */}
            <AirBudgetCostSummary 
              aircraft={selectedAircraft} 
              flightTime={form.watch("flight_time")} 
            />

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("../logbook")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update Flight" : "Save Flight")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
  );
};

export default NewFlight;
