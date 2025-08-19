import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Plane, 
  Clock, 
  MapPin,
  Calendar,
  Users,
  Edit2,
  Trash2,
  RotateCcw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


interface Flight {
  id: string;
  aircraft_id: string;
  flight_date: string;
  departure: string;
  arrival: string;
  departure_country_code?: string;
  arrival_country_code?: string;
  flight_details?: string;
  flight_rules: string;
  flight_type: string;
  day_night: string;
  flight_time?: number;
  instrument_actual?: number;
  instrument_simulated?: number;
  instrument_ground?: number;
  takeoffs: number;
  precision_approaches: number;
  non_precision_approaches: number;
  landings: number;
  aircraft_hobbs_start?: number;
  aircraft_hobbs_end?: number;
  aircraft_tacho_start?: number;
  aircraft_tacho_end?: number;
  status: string;
  aircraft: {
    tail_number: string;
    manufacturer: string;
    model: string;
    aircraft_photo_url?: string;
  };
  flight_crew: Array<{
    role: string;
    is_self: boolean;
    crew_member?: {
      first_name: string;
      last_name: string;
    };
  }>;
}

interface Stats {
  totalFlights: number;
  totalHours: number;
  totalLandings: number;
  totalTakeoffs: number;
}

const Logbook = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [incompleteFlights, setIncompleteFlights] = useState<Flight[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  const [stats, setStats] = useState<Stats>({ totalFlights: 0, totalHours: 0, totalLandings: 0, totalTakeoffs: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedFlights, setExpandedFlights] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [incompleteExpanded, setIncompleteExpanded] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAircraft, setFilterAircraft] = useState("");
  const [filterFlightRules, setFilterFlightRules] = useState("");
  const [filterFlightType, setFilterFlightType] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [aircraft, setAircraft] = useState<Array<{ id: string; tail_number: string; manufacturer: string; model: string; category: string }>>([]);
  
  const [flightsPerPage, setFlightsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load flights with aircraft and crew details
      const { data: flightsData, error: flightsError } = await supabase
        .from("flights")
        .select(`
          *,
          aircraft:aircraft_id (
            tail_number,
            manufacturer, 
            model,
            aircraft_photo_url
          ),
          flight_crew (
            role,
            is_self,
            crew_member:crew_member_id (
              first_name,
              last_name
            )
          )
        `)
        .eq("user_id", user.id)
        .order("flight_date", { ascending: false });

      if (flightsError) throw flightsError;

      // Load aircraft for filter dropdown
      const { data: aircraftData, error: aircraftError } = await supabase
        .from("aircraft")
        .select("id, tail_number, manufacturer, model, category")
        .eq("user_id", user.id)
        .order("tail_number");

      if (aircraftError) throw aircraftError;

      // Separate complete and incomplete flights
      const allFlights = flightsData || [];
      const completedFlights = allFlights.filter(flight => flight.status === 'complete');
      const incompleteFlights = allFlights.filter(flight => flight.status === 'incomplete');

      setFlights(completedFlights);
      setIncompleteFlights(incompleteFlights);
      setAircraft(aircraftData || []);
      calculateStats(completedFlights); // Only calculate stats for completed flights
    } catch (error) {
      console.error("Error loading flights:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (flightsData: Flight[]) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentFlights = flightsData.filter(flight => 
      new Date(flight.flight_date) >= thirtyDaysAgo
    );

    const stats = {
      totalFlights: recentFlights.length,
      totalHours: recentFlights.reduce((sum, flight) => sum + (flight.flight_time || 0), 0),
      totalLandings: recentFlights.reduce((sum, flight) => sum + flight.landings, 0),
      totalTakeoffs: recentFlights.reduce((sum, flight) => sum + flight.takeoffs, 0),
    };

    setStats(stats);
  };

  const getUserRole = (flightCrew: Flight["flight_crew"]): string => {
    const userRole = flightCrew.find(crew => crew.is_self);
    return userRole?.role || "Unknown";
  };

  const getCrewMembers = (flightCrew: Flight["flight_crew"]): string => {
    const otherCrew = flightCrew.filter(crew => !crew.is_self);
    if (otherCrew.length === 0) return "Solo";
    return otherCrew.map(crew => 
      `${crew.crew_member?.first_name} ${crew.crew_member?.last_name} (${crew.role})`
    ).join(", ");
  };

  const applyFilters = useCallback(() => {
    let filtered = flights;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(flight =>
        flight.aircraft.tail_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.departure.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.arrival.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.flight_details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.aircraft.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.aircraft.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aircraft filter (by tail number, type, or category)
    if (filterAircraft) {
      if (filterAircraft.startsWith('tail:')) {
        filtered = filtered.filter(flight => flight.aircraft_id === filterAircraft.replace('tail:', ''));
      } else if (filterAircraft.startsWith('type:')) {
        const type = filterAircraft.replace('type:', '');
        filtered = filtered.filter(flight => `${flight.aircraft.manufacturer} ${flight.aircraft.model}` === type);
      } else if (filterAircraft.startsWith('category:')) {
        const category = filterAircraft.replace('category:', '');
        filtered = filtered.filter(flight => {
          const aircraftInfo = aircraft.find(a => a.id === flight.aircraft_id);
          return aircraftInfo?.category === category;
        });
      }
    }

    // Flight rules filter
    if (filterFlightRules) {
      filtered = filtered.filter(flight => flight.flight_rules === filterFlightRules);
    }

    // Flight type filter  
    if (filterFlightType) {
      filtered = filtered.filter(flight => flight.flight_type === filterFlightType);
    }

    // Role filter
    if (filterRole) {
      filtered = filtered.filter(flight => {
        const userRole = getUserRole(flight.flight_crew);
        return userRole === filterRole;
      });
    }

    // Country filter
    if (filterCountry) {
      filtered = filtered.filter(flight => 
        flight.departure_country_code === filterCountry || 
        flight.arrival_country_code === filterCountry
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.flight_date).getTime() - new Date(b.flight_date).getTime();
        case "newest":
        default:
          return new Date(b.flight_date).getTime() - new Date(a.flight_date).getTime();
      }
    });

    setFilteredFlights(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [flights, searchTerm, filterAircraft, filterFlightRules, filterFlightType, filterRole, filterCountry, sortBy, aircraft]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterAircraft("");
    setFilterFlightRules("");
    setFilterFlightType("");
    setFilterRole("");
    setFilterCountry("");
    setSortBy("newest");
  };

  const toggleFlightExpansion = (flightId: string) => {
    const newExpanded = new Set(expandedFlights);
    if (newExpanded.has(flightId)) {
      newExpanded.delete(flightId);
    } else {
      newExpanded.add(flightId);
    }
    setExpandedFlights(newExpanded);
  };


  const handleEditFlight = (flightId: string) => {
    navigate(`../new-flight?edit=${flightId}`);
  };

  const handleDeleteFlight = async (flightId: string) => {
    try {
      const { error } = await supabase
        .from("flights")
        .delete()
        .eq("id", flightId);

      if (error) throw error;

      // Remove from local state - check both complete and incomplete flights
      setFlights(prev => prev.filter(f => f.id !== flightId));
      setIncompleteFlights(prev => prev.filter(f => f.id !== flightId));
      toast({
        title: "Flight deleted",
        description: "The flight has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting flight:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the flight. Please try again.",
      });
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredFlights.length / flightsPerPage);
  const startIndex = (currentPage - 1) * flightsPerPage;
  const endIndex = startIndex + flightsPerPage;
  const currentFlights = filteredFlights.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading logbook...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Flight Logbook</h1>
        {editMode ? (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-2">
                    ⚠️ Edit Mode Active
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Warning: Deleting or editing flights will impact your reports and experience summaries. Proceed with caution if you use your AirLogs data as proof of experience towards ratings or licenses.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="edit-mode" className="text-sm">Edit Mode</Label>
                  <Switch
                    id="edit-mode"
                    checked={editMode}
                    onCheckedChange={setEditMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center space-x-2">
            <Label htmlFor="edit-mode">Edit Mode</Label>
            <Switch
              id="edit-mode"
              checked={editMode}
              onCheckedChange={setEditMode}
            />
          </div>
        )}
      </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button onClick={() => navigate("../new-flight")} className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            New Flight
          </Button>
          <Button onClick={() => navigate("../fly")} variant="outline" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            Fly Now
          </Button>
        </div>

        {/* Stats Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalFlights}</div>
              <div className="text-sm text-muted-foreground">Flights (30 days)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalHours.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Hours (30 days)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalLandings}</div>
              <div className="text-sm text-muted-foreground">Landings (30 days)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalTakeoffs}</div>
              <div className="text-sm text-muted-foreground">Take-offs (30 days)</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by tail number, route, details, or aircraft type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filters and Sorting */}
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest to Oldest</SelectItem>
                      <SelectItem value="oldest">Oldest to Newest</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Flight Rules */}
                  <Select value={filterFlightRules || undefined} onValueChange={(value) => setFilterFlightRules(value || "")}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Flight Rules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VFR">VFR</SelectItem>
                      <SelectItem value="IFR">IFR</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Flight Type */}
                  <Select value={filterFlightType || undefined} onValueChange={(value) => setFilterFlightType(value || "")}>
                    <SelectTrigger className="w-full sm:w-36">
                      <SelectValue placeholder="Flight Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cross Country">Cross Country</SelectItem>
                      <SelectItem value="Local">Local</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Role */}
                  <Select value={filterRole || undefined} onValueChange={(value) => setFilterRole(value || "")}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Your Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pilot in Command">Pilot in Command</SelectItem>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Co-Pilot">Co-Pilot</SelectItem>
                      <SelectItem value="Instructor">Instructor</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Country Filter */}
                  <Select value={filterCountry || undefined} onValueChange={(value) => setFilterCountry(value || "")}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...new Set(flights.flatMap(flight => [flight.departure_country_code, flight.arrival_country_code].filter(Boolean)))].sort().map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Aircraft Filter */}
                  <Select value={filterAircraft || undefined} onValueChange={(value) => setFilterAircraft(value || "")}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Aircraft" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Tail Numbers */}
                      {aircraft.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">By Tail Number</div>
                          {aircraft.map((a) => (
                            <SelectItem key={`tail-${a.id}`} value={`tail:${a.id}`}>
                              {a.tail_number}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {/* Aircraft Types */}
                      {aircraft.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">By Type</div>
                          {[...new Set(aircraft.map(a => `${a.manufacturer} ${a.model}`))].map((type) => (
                            <SelectItem key={`type-${type}`} value={`type:${type}`}>
                              {type}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {/* Categories */}
                      {aircraft.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">By Category</div>
                          {[...new Set(aircraft.map(a => a.category))].map((category) => (
                            <SelectItem key={`category-${category}`} value={`category:${category}`}>
                              {category}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Reset Button */}
                  <Button 
                    variant="outline" 
                    size="default"
                    onClick={resetFilters}
                    className="whitespace-nowrap"
                    title="Reset Filters"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incomplete Flights Section */}
        {incompleteFlights.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIncompleteExpanded(!incompleteExpanded)}
              >
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Incomplete Flights ({incompleteFlights.length})
                </CardTitle>
                {incompleteExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {incompleteExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {incompleteFlights.map((flight) => (
                    <div key={flight.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                      <div className="flex items-center gap-3">
                        {flight.aircraft.aircraft_photo_url ? (
                          <img 
                            src={flight.aircraft.aircraft_photo_url} 
                            alt={flight.aircraft.tail_number}
                            className="w-8 h-6 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-6 bg-muted flex items-center justify-center rounded">
                            <Plane className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {flight.aircraft.tail_number} • {flight.departure} → {flight.arrival}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(flight.flight_date), "MMM d, yyyy")} • Started but not completed
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                          Incomplete
                        </Badge>
                        {editMode && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteFlight(flight.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Completed Flights List */}
        <div className="space-y-4 mb-6">
          {currentFlights.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {flights.length === 0 ? "No flights logged yet. Start by adding your first flight!" : "No flights match your current filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            currentFlights.map((flight) => {
              const isExpanded = expandedFlights.has(flight.id);
              const userRole = getUserRole(flight.flight_crew);
              const crewMembers = getCrewMembers(flight.flight_crew);

              return (
                <Card key={flight.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Collapsed State */}
                    <div 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleFlightExpansion(flight.id)}
                    >
                      {/* Mobile Layout - Photo at top */}
                      <div className="md:hidden">
                        <div className="w-full h-32 overflow-hidden">
                          {flight.aircraft.aircraft_photo_url ? (
                            <img 
                              src={flight.aircraft.aircraft_photo_url} 
                              alt={flight.aircraft.tail_number}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Plane className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="grid grid-cols-1 gap-2 flex-1">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{flight.aircraft.tail_number}</div>
                                <div className="font-medium">{flight.flight_time?.toFixed(1) || "0.0"}h</div>
                              </div>
                              <div className="text-sm text-muted-foreground">{format(new Date(flight.flight_date), "MMM d, yyyy")}</div>
                              <div className="text-sm text-muted-foreground truncate">{flight.flight_details || "No details"}</div>
                              <div className="flex items-center justify-between">
                                <Badge variant={flight.flight_rules === "IFR" ? "default" : "secondary"}>
                                  {flight.flight_rules}
                                </Badge>
                                <div className="text-sm text-muted-foreground">{userRole}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {editMode && (
                                <div className="flex items-center gap-2 mr-2" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditFlight(flight.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteFlight(flight.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tablet/Desktop Layout - Photo on left */}
                      <div className="hidden md:flex">
                        {/* Aircraft Photo - Left Side */}
                        <div className="w-32 h-24 overflow-hidden flex-shrink-0">
                          {flight.aircraft.aircraft_photo_url ? (
                            <img 
                              src={flight.aircraft.aircraft_photo_url} 
                              alt={flight.aircraft.tail_number}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Plane className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {/* Content - Right Side */}
                        <div className="flex-1 p-4 flex items-center justify-between">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1">
                            <div>
                              <div className="font-medium">{flight.aircraft.tail_number}</div>
                              <div className="text-sm text-muted-foreground">{format(new Date(flight.flight_date), "MMM d, yyyy")}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="font-medium truncate">{flight.flight_details || "No details"}</div>
                              <div className="text-sm text-muted-foreground">Flight Details</div>
                            </div>
                            <div>
                              <div className="font-medium">{flight.flight_time?.toFixed(1) || "0.0"}h</div>
                              <div className="text-sm text-muted-foreground">Flight Time</div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge variant={flight.flight_rules === "IFR" ? "default" : "secondary"}>
                                {flight.flight_rules}
                              </Badge>
                              <div className="text-sm text-muted-foreground">{userRole}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {editMode && (
                              <div className="flex items-center gap-2 mr-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditFlight(flight.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteFlight(flight.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded State */}
                    {isExpanded && (
                      <>
                        <Separator />
                        <div className="p-4 bg-muted/20">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Aircraft Details */}
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Plane className="h-4 w-4" />
                                Aircraft Details
                              </h4>
                              <div className="space-y-1 text-sm">
                                <div><strong>Tail Number:</strong> {flight.aircraft.tail_number}</div>
                                <div><strong>Make/Model:</strong> {flight.aircraft.manufacturer} {flight.aircraft.model}</div>
                                {flight.aircraft_hobbs_start && (
                                  <div><strong>Hobbs Start:</strong> {flight.aircraft_hobbs_start.toFixed(1)}</div>
                                )}
                                {flight.aircraft_hobbs_end && (
                                  <div><strong>Hobbs End:</strong> {flight.aircraft_hobbs_end.toFixed(1)}</div>
                                )}
                                {flight.aircraft_tacho_start && (
                                  <div><strong>Tacho Start:</strong> {flight.aircraft_tacho_start.toFixed(2)}</div>
                                )}
                                {flight.aircraft_tacho_end && (
                                  <div><strong>Tacho End:</strong> {flight.aircraft_tacho_end.toFixed(2)}</div>
                                )}
                              </div>
                            </div>

                            {/* Flight Information */}
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Flight Information
                              </h4>
                              <div className="space-y-1 text-sm">
                                <div><strong>Date:</strong> {format(new Date(flight.flight_date), "MMMM d, yyyy")}</div>
                                <div><strong>Route:</strong> {flight.departure} → {flight.arrival}</div>
                                {flight.departure_country_code && flight.arrival_country_code && (
                                  flight.departure_country_code === flight.arrival_country_code ? (
                                    <div><strong>Country:</strong> {flight.departure_country_code}</div>
                                  ) : (
                                    <>
                                      <div><strong>Departure Country:</strong> {flight.departure_country_code}</div>
                                      <div><strong>Arrival Country:</strong> {flight.arrival_country_code}</div>
                                    </>
                                  )
                                )}
                                <div><strong>Flight Rules:</strong> {flight.flight_rules}</div>
                                <div><strong>Flight Type:</strong> {flight.flight_type}</div>
                                <div><strong>Day/Night:</strong> {flight.day_night}</div>
                                {flight.flight_details && (
                                  <div><strong>Details:</strong> {flight.flight_details}</div>
                                )}
                              </div>
                            </div>

                            {/* Times & Crew */}
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Times & Crew
                              </h4>
                              <div className="space-y-1 text-sm">
                                <div><strong>Flight Time:</strong> {flight.flight_time?.toFixed(1) || "0.0"}h</div>
                                 {(flight.instrument_actual || flight.instrument_simulated || flight.instrument_ground) && (
                                   <>
                                     {flight.instrument_actual && (
                                       <div><strong>Instrument Actual:</strong> {flight.instrument_actual.toFixed(1)}h</div>
                                     )}
                                     {flight.instrument_simulated && (
                                       <div><strong>Instrument Simulated:</strong> {flight.instrument_simulated.toFixed(1)}h</div>
                                     )}
                                     {flight.instrument_ground && (
                                       <div><strong>Instrument Ground:</strong> {flight.instrument_ground.toFixed(1)}h</div>
                                     )}
                                   </>
                                 )}
                                 <div><strong>Your Role:</strong> {userRole}</div>
                                 <div><strong>Crew:</strong> {crewMembers}</div>
                               </div>
                             </div>

                             {/* Operations */}
                             <div>
                               <h4 className="font-semibold mb-2">Operations</h4>
                               <div className="space-y-1 text-sm">
                                 <div><strong>Take-offs:</strong> {flight.takeoffs}</div>
                                 <div><strong>Landings:</strong> {flight.landings}</div>
                                 {flight.precision_approaches > 0 && (
                                   <div><strong>Precision Approaches:</strong> {flight.precision_approaches}</div>
                                 )}
                                 {flight.non_precision_approaches > 0 && (
                                   <div><strong>Non-Precision Approaches:</strong> {flight.non_precision_approaches}</div>
                                 )}
                               </div>
                             </div>
                           </div>
                         </div>
                       </>
                     )}
                   </CardContent>
                 </Card>
               );
             })
           )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredFlights.length)} of {filteredFlights.length} flights
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={flightsPerPage.toString()}
                  onValueChange={(value) => {
                    setFlightsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              
              {/* Smart pagination - show first, last, and current range */}
              <div className="flex items-center gap-1">
                {currentPage > 3 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      className="w-10"
                    >
                      1
                    </Button>
                    {currentPage > 4 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                  </>
                )}
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  if (page < 1 || page > totalPages) return null;
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  );
                }).filter(Boolean)}
                
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-10"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Pagination for single page */}
        {totalPages === 1 && filteredFlights.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredFlights.length} of {filteredFlights.length} flights
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={flightsPerPage.toString()}
                  onValueChange={(value) => {
                    setFlightsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
            </div>
            <div></div>
          </div>
        )}
      </div>
  );
};

export default Logbook;