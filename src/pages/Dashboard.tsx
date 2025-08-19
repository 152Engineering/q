import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import FlightHoursChart from "@/components/FlightHoursChart";
import AccountSetupPrompt from "@/components/AccountSetupPrompt";
import { useProfileComplete } from "@/hooks/useProfileComplete";
import { 
  Clock, 
  Plane, 
  TrendingUp, 
  Target,
  Calendar,
  AlertCircle,
  CheckCircle,
  Moon,
  Navigation,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Flight {
  id: string;
  flight_time: number;
  flight_date: string;
  takeoffs: number;
  landings: number;
  day_night: string;
  flight_type: string;
  departure: string;
  arrival: string;
  departure_country_code?: string;
  arrival_country_code?: string;
  instrument_actual: number;
  instrument_simulated: number;
  instrument_ground: number;
  precision_approaches: number;
  non_precision_approaches: number;
  status: string;
  aircraft: {
    aircraft_type: string;
    category: string;
    tail_number: string;
  };
  flight_crew: Array<{
    role: string;
    is_self: boolean;
  }>;
}

interface ExperienceStats {
  totalFlightHours: number;
  totalPICTime: number;
  totalActualInstrument: number;
  totalSimulatedInstrument: number;
  totalGroundInstrument: number;
  totalInstrumentTime: number;
  totalCrossCountry: number;
  hoursByCategory: Record<string, number>;
  hoursByType: Record<string, number>;
  hoursByTailNumber: Record<string, number>;
}

interface CurrencyStatus {
  aircraftTypeCurrency: Record<string, { current: boolean; expiryDate: string | null }>;
  nightCurrency: { current: boolean; expiryDate: string | null };
  ifrCurrency: { current: boolean; expiryDate: string | null };
}

const Dashboard = () => {
  const { isProfileComplete, loading: profileLoading } = useProfileComplete();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [experience, setExperience] = useState<ExperienceStats>({
    totalFlightHours: 0,
    totalPICTime: 0,
    totalActualInstrument: 0,
    totalSimulatedInstrument: 0,
    totalGroundInstrument: 0,
    totalInstrumentTime: 0,
    totalCrossCountry: 0,
    hoursByCategory: {},
    hoursByType: {},
    hoursByTailNumber: {}
  });
  const [currency, setCurrency] = useState<CurrencyStatus>({
    aircraftTypeCurrency: {},
    nightCurrency: { current: false, expiryDate: null },
    ifrCurrency: { current: false, expiryDate: null }
  });
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedTailNumber, setSelectedTailNumber] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  
  // Pagination state for airport widget
  const [airportPage, setAirportPage] = useState(1);
  const AIRPORTS_PER_PAGE = 5;
  
  // Pagination state for country widget
  const [countryPage, setCountryPage] = useState(1);
  const COUNTRIES_PER_PAGE = 10;

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const { data: flightsData, error } = await supabase
        .from("flights")
        .select(`
          *,
          aircraft (aircraft_type, category, tail_number),
          flight_crew (role, is_self)
        `)
        .eq("status", "complete") // Only include completed flights
        .order("flight_date", { ascending: false });

      if (error) throw error;

      // Fetch unique aircraft for filters
      const { data: aircraftData, error: aircraftError } = await supabase
        .from("aircraft")
        .select("tail_number, aircraft_type, category")
        .order("tail_number");

      if (aircraftError) throw aircraftError;

      const typedFlights = flightsData as Flight[];
      setFlights(typedFlights);
      setAircraft(aircraftData || []);
      calculateExperience(typedFlights);
      calculateCurrency(typedFlights);
    } catch (error) {
      console.error("Error fetching flights:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter flights based on selected filters
  const filteredFlights = useMemo(() => {
    return flights.filter(flight => {
      if (!flight.aircraft) return false;
      
      const matchesTailNumber = selectedTailNumber === 'all' || flight.aircraft.tail_number === selectedTailNumber;
      const matchesType = selectedType === 'all' || flight.aircraft.aircraft_type === selectedType;
      const matchesCategory = selectedCategory === 'all' || flight.aircraft.category === selectedCategory;
      const matchesCountry = selectedCountry === 'all' || 
        flight.departure_country_code === selectedCountry || 
        flight.arrival_country_code === selectedCountry;
      
      return matchesTailNumber && matchesType && matchesCategory && matchesCountry;
    });
  }, [flights, selectedTailNumber, selectedType, selectedCategory, selectedCountry]);

  // Derived values for filter dropdowns
  const uniqueTailNumbers = useMemo(() => {
    const unique = [...new Set(aircraft.map((a: any) => a.tail_number))];
    return unique.sort();
  }, [aircraft]);

  const uniqueTypes = useMemo(() => {
    const unique = [...new Set(aircraft.map((a: any) => a.aircraft_type))];
    return unique.sort();
  }, [aircraft]);

  const uniqueCategories = useMemo(() => {
    const unique = [...new Set(aircraft.map((a: any) => a.category))];
    return unique.sort();
  }, [aircraft]);

  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    flights.forEach(flight => {
      if (flight.departure_country_code) countries.add(flight.departure_country_code);
      if (flight.arrival_country_code) countries.add(flight.arrival_country_code);
    });
    return Array.from(countries).sort();
  }, [flights]);

  const resetFilters = () => {
    setSelectedTailNumber('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedCountry('all');
    setAirportPage(1); // Reset pagination when filters change
    setCountryPage(1); // Reset pagination when filters change
  };

  const calculateExperience = (flightsData: Flight[]) => {
    const stats: ExperienceStats = {
      totalFlightHours: 0,
      totalPICTime: 0,
      totalActualInstrument: 0,
      totalSimulatedInstrument: 0,
      totalGroundInstrument: 0,
      totalInstrumentTime: 0,
      totalCrossCountry: 0,
      hoursByCategory: {},
      hoursByType: {},
      hoursByTailNumber: {}
    };

    // Use filtered flights for calculations
    const dataToProcess = flightsData === flights ? filteredFlights : flightsData;
    
    dataToProcess.forEach(flight => {
      const flightHours = flight.flight_time || 0;
      stats.totalFlightHours += flightHours;

      // Check if user was PIC (pilot in command)
      const isPIC = flight.flight_crew?.some(crew => crew.is_self && crew.role === "Pilot in Command") || false;
      if (isPIC) {
        stats.totalPICTime += flightHours;
      }

      // Instrument time
      stats.totalActualInstrument += flight.instrument_actual || 0;
      stats.totalSimulatedInstrument += flight.instrument_simulated || 0;
      stats.totalGroundInstrument += flight.instrument_ground || 0;

      // Cross country
      if (flight.flight_type === "Cross Country") {
        stats.totalCrossCountry += flightHours;
      }

      // By aircraft category, type, and tail number
      if (flight.aircraft) {
        const { category, aircraft_type, tail_number } = flight.aircraft;
        
        stats.hoursByCategory[category] = (stats.hoursByCategory[category] || 0) + flightHours;
        stats.hoursByType[aircraft_type] = (stats.hoursByType[aircraft_type] || 0) + flightHours;
        stats.hoursByTailNumber[tail_number] = (stats.hoursByTailNumber[tail_number] || 0) + flightHours;
      }
    });

    stats.totalInstrumentTime = stats.totalActualInstrument + stats.totalSimulatedInstrument + stats.totalGroundInstrument;
    setExperience(stats);
  };

  const calculateCurrency = (flightsData: Flight[]) => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Use filtered flights for currency calculations
    const dataToProcess = flightsData === flights ? filteredFlights : flightsData;
    const recentFlights = dataToProcess.filter(flight => 
      new Date(flight.flight_date) >= ninetyDaysAgo
    );

    // Aircraft type currency
    const aircraftTypeCurrency: Record<string, { current: boolean; expiryDate: string | null }> = {};
    const aircraftTypes = [...new Set(dataToProcess.map(f => f.aircraft?.aircraft_type).filter(Boolean))];

    aircraftTypes.forEach(type => {
      const typeFlights = recentFlights.filter(f => f.aircraft?.aircraft_type === type);
      const totalTakeoffs = typeFlights.reduce((sum, f) => sum + (f.takeoffs || 0), 0);
      const totalLandings = typeFlights.reduce((sum, f) => sum + (f.landings || 0), 0);
      
      const isCurrent = totalTakeoffs >= 3 && totalLandings >= 3;
      
      let expiryDate = null;
      if (typeFlights.length > 0) {
        const oldestQualifyingFlight = typeFlights
          .sort((a, b) => new Date(a.flight_date).getTime() - new Date(b.flight_date).getTime())[0];
        const oldestDate = new Date(oldestQualifyingFlight.flight_date);
        expiryDate = new Date(oldestDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      aircraftTypeCurrency[type] = { current: isCurrent, expiryDate };
    });

    // Night currency
    const nightFlights = recentFlights.filter(f => f.day_night === "Night");
    const nightTakeoffs = nightFlights.reduce((sum, f) => sum + (f.takeoffs || 0), 0);
    const nightLandings = nightFlights.reduce((sum, f) => sum + (f.landings || 0), 0);
    const nightCurrent = nightTakeoffs >= 3 && nightLandings >= 3;

    let nightExpiryDate = null;
    if (nightFlights.length > 0) {
      const oldestNightFlight = nightFlights
        .sort((a, b) => new Date(a.flight_date).getTime() - new Date(b.flight_date).getTime())[0];
      const oldestDate = new Date(oldestNightFlight.flight_date);
      nightExpiryDate = new Date(oldestDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    // IFR currency
    const instrumentTime = recentFlights.reduce((sum, f) => 
      sum + (f.instrument_actual || 0) + (f.instrument_simulated || 0), 0
    );
    const approaches = recentFlights.reduce((sum, f) => 
      sum + (f.precision_approaches || 0) + (f.non_precision_approaches || 0), 0
    );
    const ifrCurrent = instrumentTime >= 3 && approaches >= 3;

    let ifrExpiryDate = null;
    const qualifyingFlights = recentFlights.filter(f => 
      ((f.instrument_actual || 0) + (f.instrument_simulated || 0) > 0) ||
      ((f.precision_approaches || 0) + (f.non_precision_approaches || 0) > 0)
    );
    if (qualifyingFlights.length > 0) {
      const oldestQualifyingFlight = qualifyingFlights
        .sort((a, b) => new Date(a.flight_date).getTime() - new Date(b.flight_date).getTime())[0];
      const oldestDate = new Date(oldestQualifyingFlight.flight_date);
      ifrExpiryDate = new Date(oldestDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    setCurrency({
      aircraftTypeCurrency,
      nightCurrency: { current: nightCurrent, expiryDate: nightExpiryDate },
      ifrCurrency: { current: ifrCurrent, expiryDate: ifrExpiryDate }
    });
  };

  // Recalculate experience and currency when filters change
  useEffect(() => {
    if (flights.length > 0) {
      calculateExperience(flights);
      calculateCurrency(flights);
      setAirportPage(1); // Reset pagination when filters change
      setCountryPage(1); // Reset pagination when filters change
    }
  }, [filteredFlights]);

  const calculateCountryStats = (flightsData: Flight[]) => {
    const countryStats: Record<string, { flights: number; hours: number }> = {};
    let flightsWithoutCountry = { flights: 0, hours: 0 };
    
    flightsData.forEach(flight => {
      const flightHours = flight.flight_time || 0;
      const countries = new Set([flight.departure_country_code, flight.arrival_country_code].filter(Boolean));
      
      if (countries.size === 0) {
        // Flight has no country codes
        flightsWithoutCountry.flights += 1;
        flightsWithoutCountry.hours += flightHours;
      } else {
        // Flight has at least one country code
        countries.forEach(country => {
          if (country) {
            if (!countryStats[country]) {
              countryStats[country] = { flights: 0, hours: 0 };
            }
            countryStats[country].flights += 1;
            countryStats[country].hours += flightHours;
          }
        });
      }
    });
    
    return { countryStats, flightsWithoutCountry };
  };

  const formatHours = (hours: number) => `${hours.toFixed(1)}h`;
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Show account setup prompt if profile is not complete
  if (isProfileComplete === false) {
    return <AccountSetupPrompt />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        {/* Filters */}
        <div className="mb-6">
          <Card className="border-primary bg-primary/5 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Aircraft Tail #</label>
                  <Select value={selectedTailNumber} onValueChange={setSelectedTailNumber}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Aircraft</SelectItem>
                      {uniqueTailNumbers.map(tailNumber => (
                        <SelectItem key={tailNumber} value={tailNumber}>
                          {tailNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Aircraft Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {uniqueTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Aircraft Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {uniqueCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <div className="flex gap-2">
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {uniqueCountries.map(country => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={resetFilters}
                      title="Reset Filters"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Flight Hours Chart */}
        <div className="mb-8">
          <div className="border-primary bg-primary/5 shadow-sm rounded-lg p-1">
            <FlightHoursChart 
              selectedTailNumber={selectedTailNumber}
              selectedType={selectedType}
              selectedCategory={selectedCategory}
              selectedCountry={selectedCountry}
            />
          </div>
        </div>
        
        {/* Total Experience Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Total Experience
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-primary bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <i className="fas fa-clock text-sm"></i>
                  Total Flight Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatHours(experience.totalFlightHours)}</div>
              </CardContent>
            </Card>

            <Card className="border-primary bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <i className="fas fa-user-tie text-sm"></i>
                  Pilot in Command
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatHours(experience.totalPICTime)}</div>
              </CardContent>
            </Card>

            <Card className="border-primary bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <i className="fas fa-globe text-sm"></i>
                  Cross Country
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatHours(experience.totalCrossCountry)}</div>
              </CardContent>
            </Card>

            <Card className="border-primary bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <i className="fas fa-crosshairs text-sm"></i>
                  Total Instrument
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatHours(experience.totalInstrumentTime)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Instrument Time Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-primary bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <i className="fas fa-cloud text-sm"></i>
                  Actual Instrument
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatHours(experience.totalActualInstrument)}</div>
              </CardContent>
            </Card>

            <Card className="border-primary bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <i className="fas fa-glasses text-sm"></i>
                  Simulated Instrument
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatHours(experience.totalSimulatedInstrument)}</div>
              </CardContent>
            </Card>

            <Card className="border-primary bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <i className="fas fa-chalkboard-teacher text-sm"></i>
                  Ground Instrument
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatHours(experience.totalGroundInstrument)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Hours by Category, Type, and Tail Number */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            <Card className="border-primary bg-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <i className="fas fa-tags text-sm"></i>
                  Hours by Aircraft Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(experience.hoursByCategory).map(([category, hours]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-sm">{category}</span>
                    <span className="font-medium">{formatHours(hours)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-primary bg-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <i className="fas fa-plane text-sm"></i>
                  Hours by Aircraft Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(experience.hoursByType).map(([type, hours]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-sm">{type}</span>
                    <span className="font-medium">{formatHours(hours)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-primary bg-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <i className="fas fa-hashtag text-sm"></i>
                  Hours by Tail Number
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(experience.hoursByTailNumber).map(([tailNumber, hours]) => (
                  <div key={tailNumber} className="flex justify-between">
                    <span className="text-sm">{tailNumber}</span>
                    <span className="font-medium">{formatHours(hours)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Landings & Approaches and Country Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Landings and Approaches by Airport Widget */}
            <Card className="border-primary bg-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <i className="fas fa-plane-arrival text-sm"></i>
                  Landings & Approaches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  const airportStats: Record<string, { 
                    landings: number; 
                    precisionApproaches: number; 
                    nonPrecisionApproaches: number; 
                  }> = {};
                  
                  filteredFlights.forEach(flight => {
                    const arrivalAirport = flight.arrival || 'Unknown';
                    const landings = flight.landings || 0;
                    const precisionApproaches = flight.precision_approaches || 0;
                    const nonPrecisionApproaches = flight.non_precision_approaches || 0;
                    
                    if (!airportStats[arrivalAirport]) {
                      airportStats[arrivalAirport] = { 
                        landings: 0, 
                        precisionApproaches: 0, 
                        nonPrecisionApproaches: 0 
                      };
                    }
                    
                    airportStats[arrivalAirport].landings += landings;
                    airportStats[arrivalAirport].precisionApproaches += precisionApproaches;
                    airportStats[arrivalAirport].nonPrecisionApproaches += nonPrecisionApproaches;
                  });
                  
                  const sortedAirports = Object.entries(airportStats)
                    .filter(([, stats]) => stats.landings > 0 || stats.precisionApproaches > 0 || stats.nonPrecisionApproaches > 0)
                    .sort(([,a], [,b]) => (b.landings + b.precisionApproaches + b.nonPrecisionApproaches) - (a.landings + a.precisionApproaches + a.nonPrecisionApproaches));
                  
                  const totalPages = Math.ceil(sortedAirports.length / AIRPORTS_PER_PAGE);
                  const startIndex = (airportPage - 1) * AIRPORTS_PER_PAGE;
                  const endIndex = startIndex + AIRPORTS_PER_PAGE;
                  const paginatedAirports = sortedAirports.slice(startIndex, endIndex);
                  
                  return (
                    <>
                      {paginatedAirports.length > 0 ? (
                        <>
                          {paginatedAirports.map(([airport, stats]) => (
                            <div key={airport} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{airport}</span>
                                <span className="text-xs text-muted-foreground">
                                  {stats.landings}L total
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground pl-2">
                                <div className="flex justify-between">
                                  <span>Non-Precision:</span>
                                  <span>{stats.nonPrecisionApproaches}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Precision:</span>
                                  <span>{stats.precisionApproaches}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAirportPage(prev => Math.max(1, prev - 1))}
                                disabled={airportPage === 1}
                                className="h-8 px-2"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              
                              <span className="text-xs text-muted-foreground">
                                Page {airportPage} of {totalPages} ({sortedAirports.length} airports)
                              </span>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAirportPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={airportPage === totalPages}
                                className="h-8 px-2"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No landings or approaches recorded
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Flights by Country Widget */}
            <Card className="border-primary bg-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <i className="fas fa-flag text-sm"></i>
                  Flights by Country
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  const { countryStats, flightsWithoutCountry } = calculateCountryStats(filteredFlights);
                  const sortedCountries = Object.entries(countryStats).sort(([,a], [,b]) => b.hours - a.hours);
                  
                  // Add "Unknown" to the list if it has flights
                  const allEntries = [...sortedCountries];
                  if (flightsWithoutCountry.flights > 0) {
                    allEntries.push(['Unknown', flightsWithoutCountry]);
                  }
                  
                  const totalPages = Math.ceil(allEntries.length / COUNTRIES_PER_PAGE);
                  const startIndex = (countryPage - 1) * COUNTRIES_PER_PAGE;
                  const endIndex = startIndex + COUNTRIES_PER_PAGE;
                  const paginatedCountries = allEntries.slice(startIndex, endIndex);
                  
                  return (
                    <>
                      {paginatedCountries.length > 0 ? (
                        <>
                          {paginatedCountries.map(([country, stats]) => (
                            <div key={country} className={`flex justify-between items-center ${country === 'Unknown' ? 'text-muted-foreground' : ''}`}>
                              <span className="text-sm font-medium flex-1">{country}</span>
                              <span className="text-sm text-muted-foreground text-center min-w-[80px]">
                                {stats.flights} flight{stats.flights !== 1 ? 's' : ''}
                              </span>
                              <span className="font-medium text-right min-w-[60px]">{formatHours(stats.hours)}</span>
                            </div>
                          ))}
                          
                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCountryPage(prev => Math.max(1, prev - 1))}
                                disabled={countryPage === 1}
                                className="h-8 px-2"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              
                              <span className="text-xs text-muted-foreground">
                                Page {countryPage} of {totalPages} ({allEntries.length} countries)
                              </span>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCountryPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={countryPage === totalPages}
                                className="h-8 px-2"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No flight data available
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Currency Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Currency Status
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Aircraft Type Currency */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <i className="fas fa-plane text-sm"></i>
                  Aircraft Type Currency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(currency.aircraftTypeCurrency).map(([type, status]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{type}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.current ? "default" : "destructive"}>
                        {status.current ? "Current" : "Expired"}
                      </Badge>
                      {status.expiryDate && (
                        <span className="text-xs text-muted-foreground">
                          {status.current ? "Expires" : "Expired"}: {formatDate(status.expiryDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {Object.keys(currency.aircraftTypeCurrency).length === 0 && (
                  <p className="text-sm text-muted-foreground">No aircraft types found</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  3 takeoffs and 3 landings in type in last 90 days
                </p>
              </CardContent>
            </Card>

            {/* Night Currency */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <i className="fas fa-moon text-sm"></i>
                  Night Currency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={currency.nightCurrency.current ? "default" : "destructive"}>
                    {currency.nightCurrency.current ? "Current" : "Expired"}
                  </Badge>
                  {currency.nightCurrency.expiryDate && (
                    <span className="text-xs text-muted-foreground">
                      {currency.nightCurrency.current ? "Expires" : "Expired"}: {formatDate(currency.nightCurrency.expiryDate)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  3 takeoffs and 3 landings at night in last 90 days
                </p>
              </CardContent>
            </Card>

            {/* IFR Currency */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <i className="fas fa-compass text-sm"></i>
                  IFR Currency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={currency.ifrCurrency.current ? "default" : "destructive"}>
                    {currency.ifrCurrency.current ? "Current" : "Expired"}
                  </Badge>
                  {currency.ifrCurrency.expiryDate && (
                    <span className="text-xs text-muted-foreground">
                      {currency.ifrCurrency.current ? "Expires" : "Expired"}: {formatDate(currency.ifrCurrency.expiryDate)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  3 hours instrument time and 3 approaches in last 90 days
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
};

export default Dashboard;
