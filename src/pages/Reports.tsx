import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FlightStats {
  total_flight_hours: number;
  total_pic_hours: number;
  total_student_hours: number;
  total_cross_country_hours: number;
  total_instructor_hours: number;
  total_night_hours: number;
  total_instrument_hours: number;
  total_actual_instrument_hours: number;
  total_simulated_instrument_hours: number;
  total_ground_instrument_hours: number;
  total_precision_approaches: number;
  total_non_precision_approaches: number;
  hours_by_category: { [key: string]: number };
  hours_by_type: { [key: string]: number };
  low_flying_hours: number;
  terrain_weather_awareness_hours: number;
  mountain_flying_hours: number;
  student_ifr_hours: number;
  instrument_flight_time: number; // actual + simulated (excluding ground)
  student_instrument_flight_time: number; // actual + simulated as student
  instructor_instrument_flight_time: number; // instructor instrument time
  spin_recovery_hours: number;
  cross_country_pic_hours: number;
  night_pic_hours: number;
  multi_engine_hours: number;
  multi_engine_pic_hours: number;
}

interface RequirementStatus {
  requirement: string;
  current: number;
  required: number;
  met: boolean;
  unit?: string;
}

const reportOptions = [
  { value: "Full Experience Report", label: "Full Experience Report", disabled: false },
  { value: "Experience Requirements Report - Private Pilot License, Airplane", label: "Experience Requirements Report - Private Pilot License, Airplane", disabled: false },
  { value: "Experience Requirements Report - Private Pilot License, Helicopter", label: "⚠️ Experience Requirements Report - Private Pilot License, Helicopter (Coming Soon)", disabled: true },
  { value: "Experience Requirements Report - Commercial Pilot License, Airplane", label: "Experience Requirements Report - Commercial Pilot License, Airplane", disabled: false },
  { value: "Experience Requirements Report - Commercial Pilot License, Helicopter", label: "⚠️ Experience Requirements Report - Commercial Pilot License, Helicopter (Coming Soon)", disabled: true },
  { value: "Experience Requirements Report - Airline Transport Pilot License, Airplane", label: "⚠️ Experience Requirements Report - Airline Transport Pilot License, Airplane (Coming Soon)", disabled: true },
  { value: "Experience Requirements Report - Airline Transport Pilot License, Helicopter", label: "⚠️ Experience Requirements Report - Airline Transport Pilot License, Helicopter (Coming Soon)", disabled: true },
  { value: "Experience Requirements Report - Instrument Rating", label: "Experience Requirements Report - Instrument Rating", disabled: false },
  { value: "Experience Requirements Report - Category C Instructors Rating", label: "Experience Requirements Report - Category C Instructors Rating", disabled: false },
  { value: "Experience Requirements Report - Category B Instructors Rating", label: "⚠️ Experience Requirements Report - Category B Instructors Rating (Coming Soon)", disabled: true },
  { value: "Experience Requirements Report - Category A Instructors Rating", label: "⚠️ Experience Requirements Report - Category A Instructors Rating (Coming Soon)", disabled: true },
];

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [flightStats, setFlightStats] = useState<FlightStats | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);

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

  const generateFullExperienceReport = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch flights with aircraft and crew data
      const { data: flights } = await supabase
        .from("flights")
        .select(`
          *,
          aircraft:aircraft_id (category, aircraft_type),
          flight_crew (role, is_self)
        `)
        .eq("user_id", user.id);

      if (!flights) return;

      const stats: FlightStats = {
        total_flight_hours: 0,
        total_pic_hours: 0,
        total_student_hours: 0,
        total_cross_country_hours: 0,
        total_instructor_hours: 0,
        total_night_hours: 0,
        total_instrument_hours: 0,
        total_actual_instrument_hours: 0,
        total_simulated_instrument_hours: 0,
        total_ground_instrument_hours: 0,
        total_precision_approaches: 0,
        total_non_precision_approaches: 0,
        hours_by_category: {},
        hours_by_type: {},
        low_flying_hours: 0,
        terrain_weather_awareness_hours: 0,
        mountain_flying_hours: 0,
        student_ifr_hours: 0,
        instrument_flight_time: 0,
        student_instrument_flight_time: 0,
        instructor_instrument_flight_time: 0,
        spin_recovery_hours: 0,
        cross_country_pic_hours: 0,
        night_pic_hours: 0,
        multi_engine_hours: 0,
        multi_engine_pic_hours: 0,
      };

      flights.forEach((flight) => {
        const flightTime = Number(flight.flight_time) || 0;
        const userRole = flight.flight_crew?.find((crew: any) => crew.is_self)?.role || "";
        const isPIC = userRole.toLowerCase().includes("pic") || userRole.toLowerCase().includes("command");
        const isStudent = userRole.toLowerCase().includes("student");
        const isInstructor = userRole.toLowerCase().includes("instructor");
        const isNight = flight.day_night === "Night";
        const isCrossCountry = flight.flight_type === "Cross Country";
        
        stats.total_flight_hours += flightTime;
        
        if (isPIC) {
          stats.total_pic_hours += flightTime;
        }
        if (isStudent) {
          stats.total_student_hours += flightTime;
        }
        if (isInstructor) {
          stats.total_instructor_hours += flightTime;
        }
        if (isNight) {
          stats.total_night_hours += flightTime;
          if (isPIC) {
            stats.night_pic_hours += flightTime;
          }
        }

        // Cross country hours - from flight_type = "Cross Country" 
        if (isCrossCountry) {
          stats.total_cross_country_hours += flightTime;
          if (isPIC) {
            stats.cross_country_pic_hours += flightTime;
          }
        }

        // Instrument hours
        const actualInstrument = Number(flight.instrument_actual) || 0;
        const simulatedInstrument = Number(flight.instrument_simulated) || 0;
        const groundInstrument = Number(flight.instrument_ground) || 0;
        
        stats.total_actual_instrument_hours += actualInstrument;
        stats.total_simulated_instrument_hours += simulatedInstrument;
        stats.total_ground_instrument_hours += groundInstrument;
        stats.total_instrument_hours += actualInstrument + simulatedInstrument + groundInstrument;

        // Instrument flight time (actual + simulated, excluding ground)
        const instrumentFlightTime = actualInstrument + simulatedInstrument;
        stats.instrument_flight_time += instrumentFlightTime;

        // Special calculations for ratings requirements
        const isIFR = flight.flight_rules === "IFR";
        
        // Student IFR hours: student role + IFR flight rules
        if (isStudent && isIFR) {
          stats.student_ifr_hours += flightTime;
        }
        
        // Student instrument flight time: student role + instrument time (actual + simulated)
        if (isStudent && instrumentFlightTime > 0) {
          stats.student_instrument_flight_time += instrumentFlightTime;
        }
        
        // Instructor instrument flight time: instructor role + instrument time (actual + simulated)
        if (isInstructor && instrumentFlightTime > 0) {
          stats.instructor_instrument_flight_time += instrumentFlightTime;
        }

        // Approaches
        stats.total_precision_approaches += Number(flight.precision_approaches) || 0;
        stats.total_non_precision_approaches += Number(flight.non_precision_approaches) || 0;

        // Special flight types based on flight details
        const flightDetails = (flight.flight_details || "").toLowerCase();
        if (flightDetails.includes("low flying") || flightDetails.includes("low")) {
          stats.low_flying_hours += flightTime;
        }
        if (flightDetails.includes("terrain") || flightDetails.includes("weather") || flightDetails.includes("awareness")) {
          stats.terrain_weather_awareness_hours += flightTime;
        }
        if (flightDetails.includes("mountain flying") || flightDetails.includes("mountain")) {
          stats.mountain_flying_hours += flightTime;
        }
        if (flightDetails.includes("spin") && flightDetails.includes("recovery")) {
          stats.spin_recovery_hours += flightTime;
        }

        // Multi-engine hours
        const aircraftType = flight.aircraft?.aircraft_type?.toLowerCase() || "";
        const category = flight.aircraft?.category?.toLowerCase() || "";
        if (category.includes("multi") || aircraftType.includes("multi") || 
            aircraftType.includes("twin") || aircraftType.includes("be76") || 
            aircraftType.includes("pa44") || aircraftType.includes("da42")) {
          stats.multi_engine_hours += flightTime;
          if (isPIC) {
            stats.multi_engine_pic_hours += flightTime;
          }
        }

        // Category and type totals
        if (flight.aircraft?.category) {
          stats.hours_by_category[flight.aircraft.category] = 
            (stats.hours_by_category[flight.aircraft.category] || 0) + flightTime;
        }
        if (flight.aircraft?.aircraft_type) {
          stats.hours_by_type[flight.aircraft.aircraft_type] = 
            (stats.hours_by_type[flight.aircraft.aircraft_type] || 0) + flightTime;
        }
      });

      setFlightStats(stats);
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePPLAirplaneReport = async () => {
    setLoading(true);
    try {
      await generateFullExperienceReport();
      // The stats will be available in flightStats state
    } catch (error) {
      console.error("Error generating PPL Airplane report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCPLAirplaneReport = async () => {
    setLoading(true);
    try {
      await generateFullExperienceReport();
      // The stats will be available in flightStats state
    } catch (error) {
      console.error("Error generating CPL Airplane report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInstrumentRatingReport = async () => {
    setLoading(true);
    try {
      await generateFullExperienceReport();
      // The stats will be available in flightStats state
    } catch (error) {
      console.error("Error generating Instrument Rating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCategoryCInstructorsRatingReport = async () => {
    setLoading(true);
    try {
      await generateFullExperienceReport();
      // The stats will be available in flightStats state
    } catch (error) {
      console.error("Error generating Category C Instructors Rating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    setReportGenerated(true);
    if (selectedReport === "Full Experience Report") {
      generateFullExperienceReport();
    } else if (selectedReport === "Experience Requirements Report - Private Pilot License, Airplane") {
      generatePPLAirplaneReport();
    } else if (selectedReport === "Experience Requirements Report - Commercial Pilot License, Airplane") {
      generateCPLAirplaneReport();
    } else if (selectedReport === "Experience Requirements Report - Instrument Rating") {
      generateInstrumentRatingReport();
    } else if (selectedReport === "Experience Requirements Report - Category C Instructors Rating") {
      generateCategoryCInstructorsRatingReport();
    } else {
      toast({
        title: "Coming Soon",
        description: "This report type is not yet implemented",
      });
      setReportGenerated(false);
    }
  };

  const renderPPLAirplaneReport = () => {
    if (!flightStats) return null;

    const combinedInstrumentHours = flightStats.total_simulated_instrument_hours + flightStats.total_ground_instrument_hours;

    const requirements: RequirementStatus[] = [
      {
        requirement: "Total flight hours",
        current: flightStats.total_flight_hours,
        required: 50,
        met: flightStats.total_flight_hours >= 50,
        unit: "hours"
      },
      {
        requirement: "Hours as pilot in command",
        current: flightStats.total_pic_hours,
        required: 15,
        met: flightStats.total_pic_hours >= 15,
        unit: "hours"
      },
      {
        requirement: "Hours as student",
        current: flightStats.total_student_hours,
        required: 15,
        met: flightStats.total_student_hours >= 15,
        unit: "hours"
      },
      {
        requirement: "Simulated instrument or ground instrument hours",
        current: combinedInstrumentHours,
        required: 5,
        met: combinedInstrumentHours >= 5,
        unit: "hours"
      },
      {
        requirement: "Low flying hours",
        current: flightStats.low_flying_hours,
        required: 2,
        met: flightStats.low_flying_hours >= 2,
        unit: "hours"
      },
      {
        requirement: "Terrain, weather and awareness hours",
        current: flightStats.terrain_weather_awareness_hours,
        required: 2,
        met: flightStats.terrain_weather_awareness_hours >= 2,
        unit: "hours"
      }
    ];

    return (
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Private Pilot License (Airplane) - Experience Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requirements.map((req, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    req.met 
                      ? "bg-green-50 border-green-200 text-green-800" 
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <span className="font-medium">{req.requirement}</span>
                  <div className="text-right">
                    <span className="font-bold">
                      {req.current.toFixed(1)} / {req.required} {req.unit}
                    </span>
                    <div className="text-sm">
                      {req.met ? "✓ Met" : "✗ Not Met"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Low flying hours include flights with "low flying" or "low" in flight details. 
                Terrain, weather and awareness hours include flights with any of these terms: "terrain", "weather", or "awareness" in flight details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCPLAirplaneReport = () => {
    if (!flightStats) return null;

    const combinedInstrumentHours = flightStats.total_simulated_instrument_hours + flightStats.total_ground_instrument_hours;

    const requirements: RequirementStatus[] = [
      {
        requirement: "Total flight hours",
        current: flightStats.total_flight_hours,
        required: 200,
        met: flightStats.total_flight_hours >= 200,
        unit: "hours"
      },
      {
        requirement: "Hours as pilot in command",
        current: flightStats.total_pic_hours,
        required: 100,
        met: flightStats.total_pic_hours >= 100,
        unit: "hours"
      },
      {
        requirement: "Cross country hours",
        current: flightStats.total_cross_country_hours,
        required: 30,
        met: flightStats.total_cross_country_hours >= 30,
        unit: "hours"
      },
      {
        requirement: "Night flying hours",
        current: flightStats.total_night_hours,
        required: 10,
        met: flightStats.total_night_hours >= 10,
        unit: "hours"
      },
      {
        requirement: "Simulated instrument or ground instrument hours",
        current: combinedInstrumentHours,
        required: 10,
        met: combinedInstrumentHours >= 10,
        unit: "hours"
      },
      {
        requirement: "Low flying hours",
        current: flightStats.low_flying_hours,
        required: 2,
        met: flightStats.low_flying_hours >= 2,
        unit: "hours"
      },
      {
        requirement: "Mountain flying hours",
        current: flightStats.mountain_flying_hours,
        required: 2,
        met: flightStats.mountain_flying_hours >= 2,
        unit: "hours"
      }
    ];

    return (
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Commercial Pilot License (Airplane) - Experience Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requirements.map((req, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    req.met 
                      ? "bg-green-50 border-green-200 text-green-800" 
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <span className="font-medium">{req.requirement}</span>
                  <div className="text-right">
                    <span className="font-bold">
                      {req.current.toFixed(1)} / {req.required} {req.unit}
                    </span>
                    <div className="text-sm">
                      {req.met ? "✓ Met" : "✗ Not Met"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Cross country hours are based on flights marked as "Cross Country" type. 
                Low flying hours include flights with "low flying" or "low" in flight details. 
                Mountain flying hours include flights with "mountain flying" or "mountain" in flight details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFullExperienceReport = () => {
    if (!flightStats) return null;

    return (
      <div className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Flight Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Total flight hours:</span>
              <span className="font-medium">{flightStats.total_flight_hours.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total hours as Pilot in Command:</span>
              <span className="font-medium">{flightStats.total_pic_hours.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total hours as Student:</span>
              <span className="font-medium">{flightStats.total_student_hours.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total cross country hours:</span>
              <span className="font-medium">{flightStats.total_cross_country_hours.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total hours as Instructor:</span>
              <span className="font-medium">{flightStats.total_instructor_hours.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total of night flying hours:</span>
              <span className="font-medium">{flightStats.total_night_hours.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instrument Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Total Instrument Hours:</span>
              <span className="font-medium">{flightStats.total_instrument_hours.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Actual Instrument Hours:</span>
              <span className="font-medium">{flightStats.total_actual_instrument_hours.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Simulated Instrument Hours:</span>
              <span className="font-medium">{flightStats.total_simulated_instrument_hours.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Ground Instrument Hours:</span>
              <span className="font-medium">{flightStats.total_ground_instrument_hours.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Number of Non-Precision Approaches:</span>
              <span className="font-medium">{flightStats.total_non_precision_approaches}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Number of Precision Approaches:</span>
              <span className="font-medium">{flightStats.total_precision_approaches}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aircraft Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(flightStats.hours_by_category).map(([category, hours]) => (
              <div key={category} className="flex justify-between">
                <span>{category}:</span>
                <span className="font-medium">{hours.toFixed(1)} hours</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aircraft Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(flightStats.hours_by_type).map(([type, hours]) => (
              <div key={type} className="flex justify-between">
                <span>{type}:</span>
                <span className="font-medium">{hours.toFixed(1)} hours</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderInstrumentRatingReport = () => {
    if (!flightStats) return null;

    const requirements: RequirementStatus[] = [
      {
        requirement: "Cross country hours",
        current: flightStats.total_cross_country_hours,
        required: 50,
        met: flightStats.total_cross_country_hours >= 50,
        unit: "hours"
      },
      {
        requirement: "Hours as student flying under IFR rules",
        current: flightStats.student_ifr_hours,
        required: 10,
        met: flightStats.student_ifr_hours >= 10,
        unit: "hours"
      },
      {
        requirement: "Instrument time (actual + simulated + ground)",
        current: flightStats.total_instrument_hours,
        required: 40,
        met: flightStats.total_instrument_hours >= 40,
        unit: "hours"
      },
      {
        requirement: "Instrument flight time (actual + simulated)",
        current: flightStats.instrument_flight_time,
        required: 20,
        met: flightStats.instrument_flight_time >= 20,
        unit: "hours"
      },
      {
        requirement: "Instrument flight time as student (actual + simulated)",
        current: flightStats.student_instrument_flight_time,
        required: 10,
        met: flightStats.student_instrument_flight_time >= 10,
        unit: "hours"
      }
    ];

    return (
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Instrument Rating - Experience Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requirements.map((req, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    req.met 
                      ? "bg-green-50 border-green-200 text-green-800" 
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <span className="font-medium">{req.requirement}</span>
                  <div className="text-right">
                    <span className="font-bold">
                      {req.current.toFixed(1)} / {req.required} {req.unit}
                    </span>
                    <div className="text-sm">
                      {req.met ? "✓ Met" : "✗ Not Met"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Cross country hours are based on flights marked as "Cross Country" type. 
                Student IFR hours require both "Student" role and "IFR" flight rules. 
                Instrument flight time excludes ground instrument hours. 
                Student instrument flight time requires "Student" role and actual or simulated instrument time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCategoryCInstructorsRatingReport = () => {
    if (!flightStats) return null;

    const requirements: RequirementStatus[] = [
      {
        requirement: "Total flight hours",
        current: flightStats.total_flight_hours,
        required: 200,
        met: flightStats.total_flight_hours >= 200,
        unit: "hours"
      },
      {
        requirement: "Hours as pilot in command",
        current: flightStats.total_pic_hours,
        required: 150,
        met: flightStats.total_pic_hours >= 150,
        unit: "hours"
      },
      {
        requirement: "Instrument time (actual + simulated + ground)",
        current: flightStats.total_instrument_hours,
        required: 15,
        met: flightStats.total_instrument_hours >= 15,
        unit: "hours"
      },
      {
        requirement: "Instrument flight time (actual + simulated)",
        current: flightStats.instrument_flight_time,
        required: 10,
        met: flightStats.instrument_flight_time >= 10,
        unit: "hours"
      },
      {
        requirement: "Instrument flight time as instructor (actual + simulated)",
        current: flightStats.instructor_instrument_flight_time,
        required: 10,
        met: flightStats.instructor_instrument_flight_time >= 10,
        unit: "hours"
      },
      {
        requirement: "Spin and recovery hours",
        current: flightStats.spin_recovery_hours,
        required: 1,
        met: flightStats.spin_recovery_hours >= 1,
        unit: "hours"
      },
      {
        requirement: "Cross country hours as pilot in command",
        current: flightStats.cross_country_pic_hours,
        required: 40,
        met: flightStats.cross_country_pic_hours >= 40,
        unit: "hours"
      },
      {
        requirement: "Night flying hours",
        current: flightStats.total_night_hours,
        required: 10,
        met: flightStats.total_night_hours >= 10,
        unit: "hours"
      },
      {
        requirement: "Night hours as pilot in command",
        current: flightStats.night_pic_hours,
        required: 5,
        met: flightStats.night_pic_hours >= 5,
        unit: "hours"
      }
    ];

    const optionalRequirements: RequirementStatus[] = [
      {
        requirement: "Multi-engine hours (for multi-engine instruction)",
        current: flightStats.multi_engine_hours,
        required: 50,
        met: flightStats.multi_engine_hours >= 50,
        unit: "hours"
      },
      {
        requirement: "Multi-engine hours as pilot in command (for multi-engine instruction)",
        current: flightStats.multi_engine_pic_hours,
        required: 25,
        met: flightStats.multi_engine_pic_hours >= 25,
        unit: "hours"
      }
    ];

    return (
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Category C Instructors Rating - Experience Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requirements.map((req, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    req.met 
                      ? "bg-green-50 border-green-200 text-green-800" 
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <span className="font-medium">{req.requirement}</span>
                  <div className="text-right">
                    <span className="font-bold">
                      {(req.current || 0).toFixed(1)} / {req.required} {req.unit}
                    </span>
                    <div className="text-sm">
                      {req.met ? "✓ Met" : "✗ Not Met"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Optional Requirements (for Multi-Engine Instruction)</h3>
              <div className="space-y-3">
                {optionalRequirements.map((req, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3 rounded-lg border ${
                      req.met 
                        ? "bg-green-50 border-green-200 text-green-800" 
                        : "bg-yellow-50 border-yellow-200 text-yellow-800"
                    }`}
                  >
                    <span className="font-medium">{req.requirement}</span>
                    <div className="text-right">
                    <span className="font-bold">
                      {(req.current || 0).toFixed(1)} / {req.required} {req.unit}
                    </span>
                      <div className="text-sm">
                        {req.met ? "✓ Met" : "Optional"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Spin and recovery hours include flights with both "spin" and "recovery" in flight details. 
                Multi-engine hours are identified by aircraft category or type containing multi-engine indicators.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

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
      <h1 className="text-3xl font-bold mb-6">Reports</h1>
      
      {userRegion === "New Zealand" ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Report Type</label>
                <Select onValueChange={(value) => {
                  setSelectedReport(value);
                  setReportGenerated(false);
                }} value={selectedReport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a report type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {reportOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleGenerateReport}
                disabled={!selectedReport || loading}
                className="w-full"
              >
                {loading ? "Generating Report..." : "Generate Report"}
              </Button>
            </CardContent>
          </Card>
          
          {reportGenerated && selectedReport === "Full Experience Report" && flightStats && renderFullExperienceReport()}
          {reportGenerated && selectedReport === "Experience Requirements Report - Private Pilot License, Airplane" && flightStats && renderPPLAirplaneReport()}
          {reportGenerated && selectedReport === "Experience Requirements Report - Commercial Pilot License, Airplane" && flightStats && renderCPLAirplaneReport()}
          {reportGenerated && selectedReport === "Experience Requirements Report - Instrument Rating" && flightStats && renderInstrumentRatingReport()}
          {reportGenerated && selectedReport === "Experience Requirements Report - Category C Instructors Rating" && flightStats && renderCategoryCInstructorsRatingReport()}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">
            Flight reports and analytics coming soon...
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;