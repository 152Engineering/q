import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AirportInput } from "@/components/ui/airport-input";
import { supabase } from "@/integrations/supabase/client";

interface RouteField {
  id: string;
  value: string;
}

interface DepartureRow {
  id: string;
  runway: string;
  sid: string;
  transition: string;
}

interface ArrivalRow {
  id: string;
  runway: string;
  star: string;
  transition: string;
  approach: string;
}

interface AlternateRow {
  id: string;
  destination: string;
  routes: RouteField[];
  altitude: string;
  squawk: string;
  runway: string;
  star: string;
  transition: string;
  approach: string;
}

const IFRClearances = () => {
  const navigate = useNavigate();
  const [userRegion, setUserRegion] = useState<string | null>(null);
  
  // Refs for auto-focus functionality
  const airwaysRouteRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const alternateRouteRefs = useRef<{ [key: string]: { [routeId: string]: HTMLInputElement | null } }>({});
  
  // Selection state for radio calls
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  
  // Collapsible state for radio calls
  const [isRadioCallsExpanded, setIsRadioCallsExpanded] = useState(true);
  
  // Airways section state
  const [airwaysDestination, setAirwaysDestination] = useState("");
  const [airwaysRoutes, setAirwaysRoutes] = useState<RouteField[]>([{ id: "1", value: "" }]);
  const [airwaysAltitude, setAirwaysAltitude] = useState("");
  const [airwaysSquawk, setAirwaysSquawk] = useState("");
  
  // Departure section state
  const [departureRows, setDepartureRows] = useState<DepartureRow[]>([
    { id: "1", runway: "", sid: "", transition: "" }
  ]);
  
  // Arrival section state  
  const [arrivalRows, setArrivalRows] = useState<ArrivalRow[]>([
    { id: "1", runway: "", star: "", transition: "", approach: "" }
  ]);
  
  // Alternate section state
  const [alternateRows, setAlternateRows] = useState<AlternateRow[]>([
    { 
      id: "1", 
      destination: "", 
      routes: [{ id: "1", value: "" }], 
      altitude: "", 
      squawk: "", 
      runway: "", 
      star: "", 
      transition: "", 
      approach: "" 
    }
  ]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("region")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setUserRegion(profile.region);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const addAirwaysRoute = () => {
    const newId = (airwaysRoutes.length + 1).toString();
    setAirwaysRoutes([...airwaysRoutes, { id: newId, value: "" }]);
    // Focus the new field after it's rendered
    setTimeout(() => {
      airwaysRouteRefs.current[newId]?.focus();
    }, 0);
  };

  const updateAirwaysRoute = (id: string, value: string) => {
    setAirwaysRoutes(airwaysRoutes.map(route => 
      route.id === id ? { ...route, value } : route
    ));
  };

  const addDepartureRow = () => {
    const newId = (departureRows.length + 1).toString();
    setDepartureRows([...departureRows, { id: newId, runway: "", sid: "", transition: "" }]);
  };

  const updateDepartureRow = (id: string, field: keyof Omit<DepartureRow, 'id'>, value: string) => {
    setDepartureRows(departureRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const addArrivalRow = () => {
    const newId = (arrivalRows.length + 1).toString();
    setArrivalRows([...arrivalRows, { id: newId, runway: "", star: "", transition: "", approach: "" }]);
  };

  const updateArrivalRow = (id: string, field: keyof Omit<ArrivalRow, 'id'>, value: string) => {
    setArrivalRows(arrivalRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const addAlternateRow = () => {
    const newId = (alternateRows.length + 1).toString();
    setAlternateRows([...alternateRows, { 
      id: newId, 
      destination: "", 
      routes: [{ id: "1", value: "" }], 
      altitude: "", 
      squawk: "", 
      runway: "", 
      star: "", 
      transition: "", 
      approach: "" 
    }]);
  };

  const updateAlternateRow = (id: string, field: keyof Omit<AlternateRow, 'id' | 'routes'>, value: string) => {
    setAlternateRows(alternateRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const addAlternateRoute = (rowId: string) => {
    setAlternateRows(alternateRows.map(row => {
      if (row.id === rowId) {
        const newRouteId = (row.routes.length + 1).toString();
        const newRoute = { id: newRouteId, value: "" };
        // Focus the new field after it's rendered
        setTimeout(() => {
          alternateRouteRefs.current[rowId]?.[newRouteId]?.focus();
        }, 0);
        return { ...row, routes: [...row.routes, newRoute] };
      }
      return row;
    }));
  };

  const updateAlternateRoute = (rowId: string, routeId: string, value: string) => {
    setAlternateRows(alternateRows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          routes: row.routes.map(route => 
            route.id === routeId ? { ...route, value } : route
          )
        };
      }
      return row;
    }));
  };

  const toggleFieldSelection = (fieldId: string) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  };

  const isFieldSelected = (fieldId: string) => selectedFields.has(fieldId);

  const validateAltitude = (value: string) => {
    // Allow numbers up to 5 digits or FL followed by 3 digits
    const numberPattern = /^\d{1,5}$/;
    const flightLevelPattern = /^FL\d{3}$/i;
    return numberPattern.test(value) || flightLevelPattern.test(value);
  };

  const handleAltitudeChange = (value: string, setter: (value: string) => void) => {
    // Allow typing but validate format
    if (value === "" || validateAltitude(value)) {
      setter(value.toUpperCase());
    }
  };

  const handleRouteKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>, 
    currentValue: string, 
    isAirways: boolean = false, 
    rowId?: string
  ) => {
    if (e.key === "Enter" && currentValue.length === 5) {
      e.preventDefault();
      if (isAirways) {
        addAirwaysRoute();
      } else if (rowId) {
        addAlternateRoute(rowId);
      }
    }
  };

  if (userRegion !== "New Zealand") {
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
        <h1 className="text-3xl font-bold mb-6">IFR Flight Planning</h1>
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">
            This tool is currently only available for New Zealand users.
          </p>
        </div>
      </div>
    );
  }

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
      <h1 className="text-3xl font-bold mb-6">IFR Flight Planning</h1>
      
      <div className="space-y-8">
        {/* Airways Section */}
        <Card>
          <CardHeader>
            <CardTitle>Airways</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="w-full lg:w-80">
                <Label htmlFor="airways-destination">Destination</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isFieldSelected('airways-destination') ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => toggleFieldSelection('airways-destination')}
                    className={`h-10 w-10 flex-shrink-0 ${
                      isFieldSelected('airways-destination') 
                        ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                        : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <AirportInput
                    value={airwaysDestination}
                    onChange={setAirwaysDestination}
                    placeholder="Enter airport code"
                    className={isFieldSelected('airways-destination') ? 'ring-2 ring-green-600 bg-green-50' : ''}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <Label>Route <span className="text-xs text-muted-foreground">(Press enter to add next waypoint)</span></Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isFieldSelected('airways-routes') ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => toggleFieldSelection('airways-routes')}
                    className={`h-10 w-10 flex-shrink-0 ${
                      isFieldSelected('airways-routes') 
                        ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                        : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <div className={`flex gap-1 flex-1 ${isFieldSelected('airways-routes') ? 'p-2 rounded border-2 border-green-600 bg-green-50' : ''}`}>
                    {airwaysRoutes.map((route, index) => (
                      <div key={route.id} className="flex items-center gap-1">
                        <Input
                          ref={(el) => airwaysRouteRefs.current[route.id] = el}
                          value={route.value}
                          onChange={(e) => updateAirwaysRoute(route.id, e.target.value.toUpperCase())}
                          onKeyDown={(e) => handleRouteKeyDown(e, route.value, true)}
                          placeholder="Route"
                          maxLength={5}
                          className="w-20"
                        />
                        {index === airwaysRoutes.length - 1 && (
                          <Button
                            type="button"
                            variant="default"
                            size="icon"
                            onClick={addAirwaysRoute}
                            className="h-10 w-10"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="airways-altitude">Altitude</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isFieldSelected('airways-altitude') ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => toggleFieldSelection('airways-altitude')}
                    className={`h-10 w-10 flex-shrink-0 ${
                      isFieldSelected('airways-altitude') 
                        ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                        : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Input
                    id="airways-altitude"
                    value={airwaysAltitude}
                    onChange={(e) => handleAltitudeChange(e.target.value, setAirwaysAltitude)}
                    placeholder="10,000 or FL210"
                    maxLength={6}
                    className={isFieldSelected('airways-altitude') ? 'ring-2 ring-green-600 bg-green-50' : ''}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="airways-squawk">Squawk</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isFieldSelected('airways-squawk') ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => toggleFieldSelection('airways-squawk')}
                    className={`h-10 w-10 flex-shrink-0 ${
                      isFieldSelected('airways-squawk') 
                        ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                        : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Input
                    id="airways-squawk"
                    value={airwaysSquawk}
                    onChange={(e) => setAirwaysSquawk(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    className={isFieldSelected('airways-squawk') ? 'ring-2 ring-green-600 bg-green-50' : ''}
                  />
                </div>
              </div>
            </div>
            
            {/* Example Radio Calls */}
            {airwaysDestination && airwaysRoutes.some(route => route.value) && airwaysAltitude && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Example Radio Calls:</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRadioCallsExpanded(!isRadioCallsExpanded)}
                    className="h-6 w-6 p-0"
                  >
                    {isRadioCallsExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {isRadioCallsExpanded && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-blue-600">You say:</span>
                      <span className="ml-2 font-mono">
                        "Tower, ABC requesting airways to{' '}
                        <span className={isFieldSelected('airways-destination') ? 'bg-green-200 px-1 rounded' : ''}>
                          {airwaysDestination}
                        </span>{' '}
                        via{' '}
                        <span className={isFieldSelected('airways-routes') ? 'bg-green-200 px-1 rounded' : ''}>
                          {airwaysRoutes.filter(route => route.value).map(route => route.value).join(' ')}
                        </span>{' '}
                        at{' '}
                        <span className={isFieldSelected('airways-altitude') ? 'bg-green-200 px-1 rounded' : ''}>
                          {airwaysAltitude}
                        </span>{' '}
                        feet"
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-green-600">ATC say:</span>
                      <span className="ml-2 font-mono">
                        "Air traffic control unit clears ABC to{' '}
                        <span className={isFieldSelected('airways-destination') ? 'bg-green-200 px-1 rounded' : ''}>
                          {airwaysDestination}
                        </span>{' '}
                        via{' '}
                        <span className={isFieldSelected('airways-routes') ? 'bg-green-200 px-1 rounded' : ''}>
                          {airwaysRoutes.filter(route => route.value).map(route => route.value).join(' ')}
                        </span>{' '}
                        at{' '}
                        <span className={isFieldSelected('airways-altitude') ? 'bg-green-200 px-1 rounded' : ''}>
                          {airwaysAltitude}
                        </span>{' '}
                        feet, squawk 1234"
                      </span>
                    </div>
                    {airwaysSquawk && (
                      <div>
                        <span className="font-medium text-purple-600">You read back:</span>
                        <span className="ml-2 font-mono">
                          "ABC is cleared to{' '}
                          <span className={isFieldSelected('airways-destination') ? 'bg-green-200 px-1 rounded' : ''}>
                            {airwaysDestination}
                          </span>{' '}
                          via{' '}
                          <span className={isFieldSelected('airways-routes') ? 'bg-green-200 px-1 rounded' : ''}>
                            {airwaysRoutes.filter(route => route.value).map(route => route.value).join(' ')}
                          </span>{' '}
                          at{' '}
                          <span className={isFieldSelected('airways-altitude') ? 'bg-green-200 px-1 rounded' : ''}>
                            {airwaysAltitude}
                          </span>{' '}
                          feet, squawk{' '}
                          <span className={isFieldSelected('airways-squawk') ? 'bg-green-200 px-1 rounded' : ''}>
                            {airwaysSquawk}
                          </span>"
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Departure Section */}
        <Card>
          <CardHeader>
            <CardTitle>Departure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {departureRows.map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`departure-runway-${row.id}`}>Runway</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={isFieldSelected(`departure-runway-${row.id}`) ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => toggleFieldSelection(`departure-runway-${row.id}`)}
                      className={`h-10 w-10 flex-shrink-0 ${
                        isFieldSelected(`departure-runway-${row.id}`) 
                          ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                          : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Input
                      id={`departure-runway-${row.id}`}
                      value={row.runway}
                      onChange={(e) => updateDepartureRow(row.id, 'runway', e.target.value.toUpperCase())}
                      placeholder="RWY"
                      maxLength={3}
                      className={isFieldSelected(`departure-runway-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`departure-sid-${row.id}`}>SID</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={isFieldSelected(`departure-sid-${row.id}`) ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => toggleFieldSelection(`departure-sid-${row.id}`)}
                      className={`h-10 w-10 flex-shrink-0 ${
                        isFieldSelected(`departure-sid-${row.id}`) 
                          ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                          : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Input
                      id={`departure-sid-${row.id}`}
                      value={row.sid}
                      onChange={(e) => updateDepartureRow(row.id, 'sid', e.target.value.toUpperCase())}
                      placeholder="SID"
                      maxLength={6}
                      className={isFieldSelected(`departure-sid-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`departure-transition-${row.id}`}>Transition</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={isFieldSelected(`departure-transition-${row.id}`) ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => toggleFieldSelection(`departure-transition-${row.id}`)}
                      className={`h-10 w-10 flex-shrink-0 ${
                        isFieldSelected(`departure-transition-${row.id}`) 
                          ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                          : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Input
                      id={`departure-transition-${row.id}`}
                      value={row.transition}
                      onChange={(e) => updateDepartureRow(row.id, 'transition', e.target.value.toUpperCase())}
                      placeholder="Transition"
                      maxLength={5}
                      className={isFieldSelected(`departure-transition-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="default"
              onClick={addDepartureRow}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </CardContent>
        </Card>

        {/* Arrival Section */}
        <Card>
          <CardHeader>
            <CardTitle>Arrival</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {arrivalRows.map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`arrival-runway-${row.id}`}>Runway</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={isFieldSelected(`arrival-runway-${row.id}`) ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => toggleFieldSelection(`arrival-runway-${row.id}`)}
                      className={`h-10 w-10 flex-shrink-0 ${
                        isFieldSelected(`arrival-runway-${row.id}`) 
                          ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                          : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Input
                      id={`arrival-runway-${row.id}`}
                      value={row.runway}
                      onChange={(e) => updateArrivalRow(row.id, 'runway', e.target.value.toUpperCase())}
                      placeholder="RWY"
                      maxLength={3}
                      className={isFieldSelected(`arrival-runway-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`arrival-star-${row.id}`}>STAR</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={isFieldSelected(`arrival-star-${row.id}`) ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => toggleFieldSelection(`arrival-star-${row.id}`)}
                      className={`h-10 w-10 flex-shrink-0 ${
                        isFieldSelected(`arrival-star-${row.id}`) 
                          ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                          : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Input
                      id={`arrival-star-${row.id}`}
                      value={row.star}
                      onChange={(e) => updateArrivalRow(row.id, 'star', e.target.value.toUpperCase())}
                      placeholder="STAR"
                      maxLength={6}
                      className={isFieldSelected(`arrival-star-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`arrival-transition-${row.id}`}>Transition</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={isFieldSelected(`arrival-transition-${row.id}`) ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => toggleFieldSelection(`arrival-transition-${row.id}`)}
                      className={`h-10 w-10 flex-shrink-0 ${
                        isFieldSelected(`arrival-transition-${row.id}`) 
                          ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                          : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Input
                      id={`arrival-transition-${row.id}`}
                      value={row.transition}
                      onChange={(e) => updateArrivalRow(row.id, 'transition', e.target.value.toUpperCase())}
                      placeholder="Transition"
                      maxLength={5}
                      className={isFieldSelected(`arrival-transition-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`arrival-approach-${row.id}`}>Approach</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={isFieldSelected(`arrival-approach-${row.id}`) ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => toggleFieldSelection(`arrival-approach-${row.id}`)}
                      className={`h-10 w-10 flex-shrink-0 ${
                        isFieldSelected(`arrival-approach-${row.id}`) 
                          ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                          : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Input
                      id={`arrival-approach-${row.id}`}
                      value={row.approach}
                      onChange={(e) => updateArrivalRow(row.id, 'approach', e.target.value.toUpperCase())}
                      placeholder="Approach"
                      maxLength={20}
                      className={isFieldSelected(`arrival-approach-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="default"
              onClick={addArrivalRow}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </CardContent>
        </Card>

        {/* Alternate Section */}
        <Card>
          <CardHeader>
            <CardTitle>Alternate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {alternateRows.map((row) => (
              <div key={row.id} className="space-y-4 border-b border-border pb-4 last:border-b-0">
                <div className="flex flex-col lg:flex-row gap-4 items-end">
                  <div className="w-full lg:w-80">
                    <Label htmlFor={`alternate-destination-${row.id}`}>Destination</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isFieldSelected(`alternate-destination-${row.id}`) ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => toggleFieldSelection(`alternate-destination-${row.id}`)}
                        className={`h-10 w-10 flex-shrink-0 ${
                          isFieldSelected(`alternate-destination-${row.id}`) 
                            ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                            : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <AirportInput
                        value={row.destination}
                        onChange={(value) => updateAlternateRow(row.id, 'destination', value)}
                        placeholder="Enter airport code"
                        className={isFieldSelected(`alternate-destination-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label>Route <span className="text-xs text-muted-foreground">(Press enter to add next waypoint)</span></Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isFieldSelected(`alternate-routes-${row.id}`) ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => toggleFieldSelection(`alternate-routes-${row.id}`)}
                        className={`h-10 w-10 flex-shrink-0 ${
                          isFieldSelected(`alternate-routes-${row.id}`) 
                            ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                            : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <div className={`flex gap-1 flex-1 ${isFieldSelected(`alternate-routes-${row.id}`) ? 'p-2 rounded border-2 border-green-600 bg-green-50' : ''}`}>
                        {row.routes.map((route, index) => (
                          <div key={route.id} className="flex items-center gap-1">
                            <Input
                              ref={(el) => {
                                if (!alternateRouteRefs.current[row.id]) {
                                  alternateRouteRefs.current[row.id] = {};
                                }
                                alternateRouteRefs.current[row.id][route.id] = el;
                              }}
                              value={route.value}
                              onChange={(e) => updateAlternateRoute(row.id, route.id, e.target.value.toUpperCase())}
                              onKeyDown={(e) => handleRouteKeyDown(e, route.value, false, row.id)}
                              placeholder="Route"
                              maxLength={5}
                              className="w-20"
                            />
                            {index === row.routes.length - 1 && (
                              <Button
                                type="button"
                                variant="default"
                                size="icon"
                                onClick={() => addAlternateRoute(row.id)}
                                className="h-10 w-10"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`alternate-altitude-${row.id}`}>Altitude</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isFieldSelected(`alternate-altitude-${row.id}`) ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => toggleFieldSelection(`alternate-altitude-${row.id}`)}
                        className={`h-10 w-10 flex-shrink-0 ${
                          isFieldSelected(`alternate-altitude-${row.id}`) 
                            ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                            : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Input
                        id={`alternate-altitude-${row.id}`}
                        value={row.altitude}
                        onChange={(e) => handleAltitudeChange(e.target.value, (value) => updateAlternateRow(row.id, 'altitude', value))}
                        placeholder="10,000 or FL210"
                        maxLength={6}
                        className={isFieldSelected(`alternate-altitude-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`alternate-squawk-${row.id}`}>Squawk</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isFieldSelected(`alternate-squawk-${row.id}`) ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => toggleFieldSelection(`alternate-squawk-${row.id}`)}
                        className={`h-10 w-10 flex-shrink-0 ${
                          isFieldSelected(`alternate-squawk-${row.id}`) 
                            ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                            : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                        <Input
                          id={`alternate-squawk-${row.id}`}
                          value={row.squawk}
                          onChange={(e) => updateAlternateRow(row.id, 'squawk', e.target.value.replace(/\D/g, '').slice(0, 4))}
                          maxLength={4}
                          className={isFieldSelected(`alternate-squawk-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                        />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`alternate-runway-${row.id}`}>Runway</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isFieldSelected(`alternate-runway-${row.id}`) ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => toggleFieldSelection(`alternate-runway-${row.id}`)}
                        className={`h-10 w-10 flex-shrink-0 ${
                          isFieldSelected(`alternate-runway-${row.id}`) 
                            ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                            : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Input
                        id={`alternate-runway-${row.id}`}
                        value={row.runway}
                        onChange={(e) => updateAlternateRow(row.id, 'runway', e.target.value.toUpperCase())}
                        placeholder="RWY"
                        maxLength={3}
                        className={isFieldSelected(`alternate-runway-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`alternate-star-${row.id}`}>STAR</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isFieldSelected(`alternate-star-${row.id}`) ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => toggleFieldSelection(`alternate-star-${row.id}`)}
                        className={`h-10 w-10 flex-shrink-0 ${
                          isFieldSelected(`alternate-star-${row.id}`) 
                            ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                            : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Input
                        id={`alternate-star-${row.id}`}
                        value={row.star}
                        onChange={(e) => updateAlternateRow(row.id, 'star', e.target.value.toUpperCase())}
                        placeholder="STAR"
                        maxLength={6}
                        className={isFieldSelected(`alternate-star-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`alternate-transition-${row.id}`}>Transition</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isFieldSelected(`alternate-transition-${row.id}`) ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => toggleFieldSelection(`alternate-transition-${row.id}`)}
                        className={`h-10 w-10 flex-shrink-0 ${
                          isFieldSelected(`alternate-transition-${row.id}`) 
                            ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                            : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Input
                        id={`alternate-transition-${row.id}`}
                        value={row.transition}
                        onChange={(e) => updateAlternateRow(row.id, 'transition', e.target.value.toUpperCase())}
                        placeholder="Transition"
                        maxLength={5}
                        className={isFieldSelected(`alternate-transition-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`alternate-approach-${row.id}`}>Approach</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isFieldSelected(`alternate-approach-${row.id}`) ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => toggleFieldSelection(`alternate-approach-${row.id}`)}
                        className={`h-10 w-10 flex-shrink-0 ${
                          isFieldSelected(`alternate-approach-${row.id}`) 
                            ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                            : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Input
                        id={`alternate-approach-${row.id}`}
                        value={row.approach}
                        onChange={(e) => updateAlternateRow(row.id, 'approach', e.target.value.toUpperCase())}
                        placeholder="Approach"
                        maxLength={20}
                        className={isFieldSelected(`alternate-approach-${row.id}`) ? 'ring-2 ring-green-600 bg-green-50' : ''}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="default"
              onClick={addAlternateRow}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IFRClearances;