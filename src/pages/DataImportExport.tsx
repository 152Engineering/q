import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Users, Plane, Download, Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";

interface ImportedAircraft {
  id: string;
  tail_number: string;
  aircraft_type: string;
  manufacturer: string;
  model: string;
  category: string;
}

interface ImportedCrew {
  id: string;
  first_name: string;
  last_name: string;
}

interface ParsedFlightRow {
  date: string;
  aircraftType: string;
  tailNumber: string;
  pic: string;
  coPilot: string;
  flightDetails: string;
  flightHours: number;
  role: string;
  timeOfDay: string;
  crewRole?: string;
  actualInstrument?: number;
  simulatedInstrument?: number;
  groundInstrument?: number;
  nonPrecisionApproaches?: number;
  precisionApproaches?: number;
  isCrossCountry: boolean;
  takeoffs: number;
  landings: number;
  isInstructor?: boolean;
  departure?: string;
  arrival?: string;
}

const DataImportExport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  
  // Step 1 - Aircraft
  const [importedAircraft, setImportedAircraft] = useState<ImportedAircraft[]>([]);
  const [aircraftConfirmed, setAircraftConfirmed] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<ImportedAircraft | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Step 2 - Crew
  const [importedCrew, setImportedCrew] = useState<ImportedCrew[]>([]);
  
  // Step 3 - Flights
  const [parsedFlights, setParsedFlights] = useState<ParsedFlightRow[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  const logbookFormats = [
    { value: "nz-caa", label: "New Zealand CAA Logbook Format" },
    { value: "garmin", label: "⚠️ Garmin Pilot Logbook Export (not implemented yet)" },
    { value: "foreflight", label: "⚠️ Foreflight Logbook Export (not implemented yet)" }
  ];

  const importSteps = [
    { icon: Plane, title: "Creating Aircraft", description: "Processing aircraft data from tail numbers..." },
    { icon: Users, title: "Creating Crew", description: "Processing crew data from names..." },
    { icon: FileText, title: "Creating Flights", description: "Importing flights to your logbook..." }
  ];

  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setUserProfile(profile);
      }
    };
    loadUserProfile();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
    }
  };

  const toProperCase = (text: string): string => {
    return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const parseCSVRow = (row: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseNZCAAFormat = (csvContent: string): ParsedFlightRow[] => {
    const lines = csvContent.split('\n').filter(line => line.trim());
    console.log(`Total lines in CSV: ${lines.length}`);
    console.log('First few lines:', lines.slice(0, 5));
    
    const dataRows = lines.slice(3); // Skip first 3 header rows (1-3), data starts at row 4
    console.log(`Data rows to process: ${dataRows.length}`);
    console.log('First data row:', dataRows[0]);
    
    let skippedReasons: { [key: string]: number } = {
      'empty_date': 0,
      'invalid_date': 0,
      'no_flight_hours': 0,
      'parse_error': 0,
      'consecutive_empty': 0
    };
    
    const parsedFlights: ParsedFlightRow[] = [];
    let consecutiveEmptyRows = 0;
    const maxConsecutiveEmpty = 5;

    for (const row of dataRows) {
      try {
        const cols = parseCSVRow(row);
        console.log(`Processing row with ${cols.length} columns:`, cols.slice(0, 10)); // Show first 10 columns
        
        // Skip rows with insufficient data or empty dates
        if (!cols[0] || cols[0].trim() === '') {
          console.log(`Skipping row ${parsedFlights.length + 1} - empty date`);
          skippedReasons['empty_date']++;
          consecutiveEmptyRows++;
          if (consecutiveEmptyRows >= maxConsecutiveEmpty) {
            console.log(`Found ${maxConsecutiveEmpty} consecutive empty rows, stopping parsing`);
            skippedReasons['consecutive_empty']++;
            break;
          }
          continue;
        }
        
        // Reset counter when we find a non-empty row
        consecutiveEmptyRows = 0;
        
        // Parse date from NZ timezone to UTC with better error handling
        let utcDate: Date;
        try {
          const dateStr = cols[0].trim();
          let nzDate: Date;
          
          // Use user's date format preference to parse the date
          const userDateFormat = userProfile?.date_format || 'DD/MM/YYYY';
          const parts = dateStr.split('/');
          
          if (parts.length === 3) {
            // Pad single digits with leading zeros for consistent parsing
            const paddedParts = parts.map(part => part.padStart(2, '0'));
            let day, month, year;
            
            switch (userDateFormat) {
              case 'MM/DD/YYYY':
                month = parseInt(paddedParts[0]);
                day = parseInt(paddedParts[1]);
                year = parseInt(paddedParts[2]);
                break;
              case 'DD/MM/YYYY':
              case 'DD-MM-YYYY':
              default:
                day = parseInt(paddedParts[0]);
                month = parseInt(paddedParts[1]);
                year = parseInt(paddedParts[2]);
                break;
              case 'YYYY-MM-DD':
                year = parseInt(paddedParts[0]);
                month = parseInt(paddedParts[1]);
                day = parseInt(paddedParts[2]);
                break;
            }
            
            // Create date object (month is 0-indexed in JavaScript Date)
            nzDate = new Date(year, month - 1, day);
          } else {
            // Try default JavaScript date parsing as fallback
            nzDate = new Date(dateStr);
          }
          
          // If still invalid, skip this row
          if (isNaN(nzDate.getTime())) {
            console.warn(`Skipping row ${parsedFlights.length + 1} - Invalid date format: ${dateStr} with format ${userDateFormat}`);
            skippedReasons['invalid_date']++;
            continue;
          }
          
          utcDate = fromZonedTime(nzDate, 'Pacific/Auckland');
        } catch (dateError) {
          console.warn(`Skipping row ${parsedFlights.length + 1} - Date parsing error for "${cols[0]}":`, dateError);
          skippedReasons['invalid_date']++;
          continue;
        }
        
        // Safely access columns with default values
        const safeFloat = (val: string | undefined) => {
          const num = parseFloat(val || '0');
          return isNaN(num) ? 0 : num;
        };
        
        const safeInt = (val: string | undefined) => {
          const num = parseInt(val || '0');
          return isNaN(num) ? 0 : num;
        };
        
        // Parse new columns: AC (Is Instructor), AD (Departure), AE (Arrival)
        const isInstructor = (cols[28] || '').trim().toLowerCase() === 'yes'; // Column AC
        const departure = (cols[29] || '').trim(); // Column AD
        const arrival = (cols[30] || '').trim(); // Column AE
        
        // Determine flight hours and roles from columns G-R
        let flightHours = 0;
        let role = 'Pilot in Command';
        let timeOfDay = 'Day';
        let crewRole = undefined;
        
        // Check each column for flight hours with safe parsing
        const colG = safeFloat(cols[6]); // Dual instruction day
        const colH = safeFloat(cols[7]); // PIC day
        const colI = safeFloat(cols[8]); // Dual instruction night
        const colJ = safeFloat(cols[9]); // PIC night
        const colK = safeFloat(cols[10]); // Dual instruction day (alt)
        const colL = safeFloat(cols[11]); // PIC day (alt)
        const colM = safeFloat(cols[12]); // Co-pilot day
        const colN = safeFloat(cols[13]); // Co-pilot night
        const colO = safeFloat(cols[14]); // Dual instruction night (alt)
        const colP = safeFloat(cols[15]); // PIC night (alt)
        const colQ = safeFloat(cols[16]); // Co-pilot day (alt)
        const colR = safeFloat(cols[17]); // Co-pilot night (alt)
        
        if (colG > 0 || colK > 0) {
          flightHours = colG || colK;
          role = 'Student';
          crewRole = 'Instructor';
          timeOfDay = 'Day';
        } else if (colH > 0 || colL > 0) {
          flightHours = colH || colL;
          role = 'Pilot in Command';
          crewRole = 'Co-Pilot';
          timeOfDay = 'Day';
        } else if (colI > 0 || colO > 0) {
          flightHours = colI || colO;
          role = 'Student';
          crewRole = 'Instructor';
          timeOfDay = 'Night';
        } else if (colJ > 0 || colP > 0) {
          flightHours = colJ || colP;
          role = 'Pilot in Command';
          crewRole = 'Co-Pilot';
          timeOfDay = 'Night';
        } else if (colM > 0 || colN > 0 || colQ > 0 || colR > 0) {
          flightHours = colM || colN || colQ || colR;
          role = 'Co-Pilot';
          crewRole = 'Pilot in Command';
          timeOfDay = (colN > 0 || colR > 0) ? 'Night' : 'Day';
        }
        
        // Override roles if "Is Instructor" column is "Yes"
        if (isInstructor) {
          role = 'Instructor';
          crewRole = 'Student';
        }
        
        console.log(`Flight hours found: ${flightHours}, Role: ${role}, Time: ${timeOfDay}`);
        
        // Skip rows with no flight hours
        if (flightHours === 0) {
          console.log(`Skipping row ${parsedFlights.length + 1} - no flight hours found (columns G-R all zero or empty)`);
          skippedReasons['no_flight_hours']++;
          continue;
        }
        
        const crossCountryTime = safeFloat(cols[23]);
        const crossCountryValue = (cols[23] || '').trim().toLowerCase();
        const dayTakeoffs = safeInt(cols[24]);
        const nightTakeoffs = safeInt(cols[25]);
        const dayLandings = safeInt(cols[26]);
        const nightLandings = safeInt(cols[27]);
        
        const parsedFlight: ParsedFlightRow = {
          date: format(utcDate, 'yyyy-MM-dd'),
          aircraftType: (cols[1] || '').trim(),
          tailNumber: (cols[2] || '').trim(),
          pic: (cols[3] || '').trim(),
          coPilot: (cols[4] || '').trim(),
          flightDetails: (cols[5] || '').trim(),
          flightHours,
          role,
          timeOfDay,
          crewRole,
          actualInstrument: safeFloat(cols[18]) || undefined,
          simulatedInstrument: safeFloat(cols[19]) || undefined,
          groundInstrument: safeFloat(cols[20]) || undefined,
          nonPrecisionApproaches: safeInt(cols[21]) || undefined,
          precisionApproaches: safeInt(cols[22]) || undefined,
          isCrossCountry: crossCountryTime > 0 || crossCountryValue === 'yes',
          takeoffs: dayTakeoffs + nightTakeoffs,
          landings: dayLandings + nightLandings,
          departure: departure || undefined,
          arrival: arrival || undefined
        };
        
        parsedFlights.push(parsedFlight);
        
      } catch (rowError) {
        console.warn(`Skipping row ${parsedFlights.length + 1} - Error parsing row: ${row}`, rowError);
        skippedReasons['parse_error']++;
        continue; // Skip problematic rows
      }
    }
    
    // Log summary of skipped flights
    const totalSkipped = Object.values(skippedReasons).reduce((sum, count) => sum + count, 0);
    console.log(`\n=== IMPORT SUMMARY ===`);
    console.log(`Total data rows processed: ${dataRows.length}`);
    console.log(`Successfully parsed flights: ${parsedFlights.length}`);
    console.log(`Total skipped flights: ${totalSkipped}`);
    console.log(`Skipped breakdown:`, skippedReasons);
    
    if (totalSkipped > 0) {
      console.warn(`⚠️ Some flights were skipped during import. Check the console logs above for details.`);
    }
    
    return parsedFlights;
  };

  const startImport = async () => {
    if (!selectedFile || !selectedFormat || selectedFormat !== 'nz-caa') {
      toast({
        title: "Unsupported Format",
        description: "Currently only NZ CAA Logbook Format is supported.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsImporting(true);
      setCurrentStep(0);
      setImportProgress(0);

      // Read and parse CSV
      const csvContent = await selectedFile.text();
      const flights = parseNZCAAFormat(csvContent);
      setParsedFlights(flights);
      
      // Step 1: Process Aircraft
      setImportProgress(25);
      await processAircraftStep(flights);
      
      setImportProgress(100);
      // Don't automatically advance to step 2 - wait for user confirmation
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "There was an error processing your CSV file.",
        variant: "destructive"
      });
      setIsImporting(false);
    }
  };

  const processAircraftStep = async (flights: ParsedFlightRow[]) => {
    console.log(`Processing aircraft step with ${flights.length} flights`);
    
    // Get unique aircraft from CSV
    const uniqueAircraft = Array.from(
      new Set(flights.map(f => f.tailNumber))
    ).filter(Boolean);
    
    console.log('Unique aircraft from CSV:', uniqueAircraft);

    // Get existing user aircraft
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.id);
    
    const { data: existingAircraft, error: aircraftError } = await supabase
      .from('aircraft')
      .select('tail_number')
      .eq('user_id', user?.id);

    console.log('Existing aircraft query result:', existingAircraft, 'Error:', aircraftError);
    console.log('Existing aircraft:', existingAircraft?.map(a => a.tail_number));

    const existingTailNumbers = existingAircraft?.map(a => a.tail_number) || [];
    const newAircraft = uniqueAircraft.filter(tail => !existingTailNumbers.includes(tail));
    
    console.log('New aircraft to create:', newAircraft);

    // Create aircraft data with type lookups
    const aircraftToCreate: ImportedAircraft[] = [];
    
    for (const tailNumber of newAircraft) {
      const flight = flights.find(f => f.tailNumber === tailNumber);
      const aircraftType = flight?.aircraftType || '';
      
      console.log(`Looking up aircraft type: ${aircraftType} for tail: ${tailNumber}`);
      
      // Look up aircraft type in designators table
      const { data: typeData, error: typeError } = await supabase
        .from('aircraft_type_designators')
        .select('manufacturer, model, type')
        .eq('type', aircraftType)
        .single();
      
      console.log(`Type lookup result for ${aircraftType}:`, typeData, typeError);
      
      aircraftToCreate.push({
        id: crypto.randomUUID(),
        tail_number: tailNumber,
        aircraft_type: aircraftType,
        manufacturer: typeData ? toProperCase(typeData.manufacturer) : '',
        model: typeData ? toProperCase(typeData.model) : '',
        category: 'Single-Engine Airplane Land' // Default category
      });
    }
    
    console.log('Aircraft to create:', aircraftToCreate);
    console.log('Number of aircraft to create:', aircraftToCreate.length);

    setImportedAircraft(aircraftToCreate);
  };

  const continueToCrewStep = async () => {
    try {
      // Create aircraft in database
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const aircraft of importedAircraft) {
        await supabase.from('aircraft').insert({
          user_id: user?.id,
          tail_number: aircraft.tail_number,
          aircraft_type: aircraft.aircraft_type,
          manufacturer: aircraft.manufacturer,
          model: aircraft.model,
          category: aircraft.category as 'Single-Engine Airplane Land'
        });
      }

      setCurrentStep(1);
      setImportProgress(0);
      
      // Process crew step
      await processCrewStep();
      
    } catch (error) {
      console.error('Aircraft creation error:', error);
      toast({
        title: "Aircraft Creation Failed",
        description: "There was an error creating aircraft records.",
        variant: "destructive"
      });
    }
  };

  const processCrewStep = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Processing crew step for user:', user?.id);
    
    // Get all names from flights
    const allNames = new Set<string>();
    parsedFlights.forEach(flight => {
      if (flight.pic) allNames.add(flight.pic);
      if (flight.coPilot) allNames.add(flight.coPilot);
    });
    
    console.log('All names from flights:', Array.from(allNames));

    // Filter out user names and "self"
    const userFullName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : '';
    console.log('User full name:', userFullName);
    
    const crewNames = Array.from(allNames).filter(name => 
      name.toLowerCase() !== 'self' && 
      name !== userFullName &&
      name.trim() !== ''
    );
    
    console.log('Filtered crew names:', crewNames);

    // Get existing crew
    const { data: existingCrew, error: crewError } = await supabase
      .from('crew')
      .select('first_name, last_name')
      .eq('user_id', user?.id);
      
    console.log('Existing crew query result:', existingCrew, 'Error:', crewError);

    const existingNames = existingCrew?.map(c => `${c.first_name} ${c.last_name}`) || [];
    const newCrewNames = crewNames.filter(name => !existingNames.includes(name));

    const crewToCreate: ImportedCrew[] = newCrewNames.map(name => {
      const [firstName, ...lastNameParts] = name.split(' ');
      return {
        id: crypto.randomUUID(),
        first_name: firstName || '',
        last_name: lastNameParts.join(' ') || ''
      };
    });

    setImportedCrew(crewToCreate);
    setImportProgress(100);
  };

  const continueToFlightsStep = async () => {
    try {
      // Create crew in database
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const crew of importedCrew) {
        await supabase.from('crew').insert({
          user_id: user?.id,
          first_name: crew.first_name,
          last_name: crew.last_name
        });
      }

      setCurrentStep(2);
      setImportProgress(0);
      
      // Process flights step
      await processFlightsStep();
      
    } catch (error) {
      console.error('Crew creation error:', error);
      toast({
        title: "Crew Creation Failed",
        description: "There was an error creating crew records.",
        variant: "destructive"
      });
    }
  };

  const processFlightsStep = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get all aircraft and crew for mapping
      const { data: allAircraft } = await supabase
        .from('aircraft')
        .select('id, tail_number')
        .eq('user_id', user?.id);
      
      const { data: allCrew } = await supabase
        .from('crew')
        .select('id, first_name, last_name')
        .eq('user_id', user?.id);

      const aircraftMap = new Map(allAircraft?.map(a => [a.tail_number, a.id]) || []);
      const crewMap = new Map(allCrew?.map(c => [`${c.first_name} ${c.last_name}`, c.id]) || []);
      const userFullName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : '';

      let processed = 0;
      let skippedNoAircraft = 0;
      
      for (const flight of parsedFlights) {
        const aircraftId = aircraftMap.get(flight.tailNumber);
        if (!aircraftId) {
          console.warn(`Skipping flight - no aircraft found for tail number: ${flight.tailNumber}`);
          skippedNoAircraft++;
          continue;
        }

        // Create flight record
        const { data: newFlight } = await supabase
          .from('flights')
          .insert({
            user_id: user?.id,
            aircraft_id: aircraftId,
            flight_date: flight.date,
            departure: flight.departure || 'Unknown',
            arrival: flight.arrival || 'Unknown',
            flight_details: flight.flightDetails,
            flight_rules: ((flight.actualInstrument && flight.actualInstrument > 0) || 
                          (flight.simulatedInstrument && flight.simulatedInstrument > 0)) &&
                         ((flight.precisionApproaches && flight.precisionApproaches > 0) ||
                          (flight.nonPrecisionApproaches && flight.nonPrecisionApproaches > 0)) ? 'IFR' : 'VFR',
            flight_type: flight.isCrossCountry ? 'Cross Country' : 'Local',
            day_night: flight.timeOfDay,
            flight_time: flight.flightHours,
            instrument_actual: flight.actualInstrument,
            instrument_simulated: flight.simulatedInstrument,
            instrument_ground: flight.groundInstrument,
            takeoffs: flight.takeoffs,
            precision_approaches: flight.precisionApproaches || 0,
            non_precision_approaches: flight.nonPrecisionApproaches || 0,
            landings: flight.landings,
            status: 'complete'
          })
          .select()
          .single();

        // Create flight crew records
        if (newFlight) {
          // User role
          await supabase.from('flight_crew').insert({
            flight_id: newFlight.id,
            role: flight.role,
            is_self: true
          });

          // Crew member role (if exists)
          if (flight.crewRole) {
            const crewName = flight.pic.toLowerCase() === 'self' || flight.pic === userFullName 
              ? flight.coPilot 
              : flight.pic;
            
            const crewId = crewMap.get(crewName);
            if (crewId) {
              await supabase.from('flight_crew').insert({
                flight_id: newFlight.id,
                role: flight.crewRole,
                crew_member_id: crewId,
                is_self: false
              });
            }
          }
        }

        processed++;
        setImportProgress((processed / parsedFlights.length) * 100);
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${processed} flights.`,
      });

      setIsImporting(false);
      setCurrentStep(0);
      setImportProgress(0);
      
    } catch (error) {
      console.error('Flights creation error:', error);
      toast({
        title: "Flights Import Failed",
        description: "There was an error importing flight records.",
        variant: "destructive"
      });
    }
  };

  const handleEditAircraft = (aircraft: ImportedAircraft) => {
    setEditingAircraft(aircraft);
    setIsEditDialogOpen(true);
  };

  const handleSaveAircraft = (updatedAircraft: ImportedAircraft) => {
    setImportedAircraft(prev => 
      prev.map(a => a.id === updatedAircraft.id ? updatedAircraft : a)
    );
    setIsEditDialogOpen(false);
    setEditingAircraft(null);
  };

  const startExport = async () => {
    setIsExporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('export-flights-csv');
      
      if (error) {
        console.error('Export error:', error);
        toast({
          title: "Export Failed",
          description: "There was an error exporting your flights. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Create blob and download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flights-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Your flights have been exported to CSV successfully."
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your flights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
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
      
      <h1 className="text-3xl font-bold mb-6">Data Import / Export</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Pilot Logbook
            </CardTitle>
            <CardDescription>
              Import your existing logbook data from a CSV file. Select the format that matches your export.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isImporting ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Logbook Format</label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the format of your CSV file" />
                    </SelectTrigger>
                    <SelectContent>
                      {logbookFormats.map((format) => (
                        <SelectItem 
                          key={format.value} 
                          value={format.value}
                          disabled={format.value !== 'nz-caa'}
                          className={format.value !== 'nz-caa' ? 'text-muted-foreground' : ''}
                        >
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFormat === 'nz-caa' && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Import instructions for New Zealand CAA Format:</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-disc list-inside">
                      <li>Download the <a href="https://tozyxilbmyyoqdhkqkqe.supabase.co/storage/v1/object/public/import-examples/nz-caa-sample_logbook_import.csv" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300">sample CSV file</a>.</li>
                      <li>Fill in Columns A to U exactly the same as your NZ CAA Paper logbook.</li>
                      <li>Columns V and W are where you can record precision approaches (E.g. ILS) and Non-Precision Approaches (E.g. VOR/DME). This is important for IFR currency calculations.</li>
                      <li>Column X is where you record whether a flight was cross country or not. This is important for experience requirements calculations.</li>
                      <li>Columns Y to AB are where you record your take-offs and landings. This is important for night current and aircraft type currency.</li>
                      <li>Column AC is for flight instructors. Simply put "Yes" here if you were giving instruction on that flight.</li>
                      <li>Columns AD and AE is where you add your airport codes. This is optional but nice to have.</li>
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <Button 
                  onClick={startImport}
                  disabled={!selectedFile || !selectedFormat}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Start Import
                </Button>
              </>
            ) : currentStep === 0 ? (
              // Step 1: Aircraft Import
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Step 1: Aircraft Import</h3>
                  <p className="text-muted-foreground">Review and confirm aircraft details before continuing.</p>
                </div>

                {importedAircraft.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      {importedAircraft.map((aircraft) => (
                        <Card key={aircraft.id} className="border border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{aircraft.tail_number}</h4>
                                  <Badge variant="outline">{aircraft.aircraft_type}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {aircraft.manufacturer} {aircraft.model} • {aircraft.category}
                                </p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditAircraft(aircraft)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="aircraft-confirmed" 
                        checked={aircraftConfirmed}
                        onCheckedChange={(checked) => setAircraftConfirmed(checked === true)}
                      />
                      <label 
                        htmlFor="aircraft-confirmed" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I have checked that imported aircraft data is correct
                      </label>
                    </div>

                    <Button 
                      onClick={continueToCrewStep}
                      disabled={!aircraftConfirmed}
                      className="w-full"
                    >
                      Continue Import
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No new aircraft found in your CSV file.</p>
                    <Button onClick={continueToCrewStep} className="mt-4">
                      Continue to Crew Step
                    </Button>
                  </div>
                )}
              </div>
            ) : currentStep === 1 ? (
              // Step 2: Crew Import
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Step 2: Crew Import</h3>
                  <p className="text-muted-foreground">Found {importedCrew.length} new crew members to add.</p>
                </div>

                {importedCrew.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {importedCrew.map((crew) => (
                        <Card key={crew.id} className="border border-green-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{crew.first_name} {crew.last_name}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Button onClick={continueToFlightsStep} className="w-full">
                      Continue Import
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No new crew members found in your CSV file.</p>
                    <Button onClick={continueToFlightsStep} className="mt-4">
                      Continue to Flights Step
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Step 3: Flights Import
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Step 3: Importing Flights</h3>
                  <p className="text-muted-foreground">Importing {parsedFlights.length} flights to your logbook...</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-lg border border-primary bg-primary/5">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Creating Flights</h4>
                      <p className="text-sm text-muted-foreground">Importing flights to your logbook...</p>
                      <div className="mt-2">
                        <Progress value={importProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round((importProgress / 100) * parsedFlights.length)} / {parsedFlights.length} flights
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export to CSV
            </CardTitle>
            <CardDescription>
              Export all your flight records to a CSV file with complete details including aircraft and crew information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="rounded-lg border border-muted bg-muted/50 p-4">
                <h4 className="font-medium mb-2">Export includes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All flight details (date, departure, arrival, times)</li>
                  <li>• Aircraft information (tail number, manufacturer, model)</li>
                  <li>• Crew assignments (PIC, SIC, CFI, Safety Pilot)</li>
                  <li>• Instrument time and approaches</li>
                  <li>• Takeoffs and landings</li>
                  <li>• Hobbs and Tach times</li>
                </ul>
              </div>

              <Button 
                onClick={startExport}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export All Flights
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aircraft Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Aircraft Details</DialogTitle>
          </DialogHeader>
          {editingAircraft && (
            <AircraftEditForm 
              aircraft={editingAircraft} 
              onSave={handleSaveAircraft}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Aircraft Edit Form Component
const AircraftEditForm = ({ 
  aircraft, 
  onSave, 
  onCancel 
}: { 
  aircraft: ImportedAircraft;
  onSave: (aircraft: ImportedAircraft) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState(aircraft);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tail_number">Tail Number</Label>
        <Input
          id="tail_number"
          value={formData.tail_number}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">Tail number cannot be edited</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="aircraft_type">Aircraft Type</Label>
        <Input
          id="aircraft_type"
          value={formData.aircraft_type}
          onChange={(e) => setFormData(prev => ({ ...prev, aircraft_type: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="manufacturer">Manufacturer</Label>
        <Input
          id="manufacturer"
          value={formData.manufacturer}
          onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Input
          id="model"
          value={formData.model}
          onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select 
          value={formData.category} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Single-Engine Airplane Land">Single-Engine Airplane Land</SelectItem>
            <SelectItem value="Multi-Engine Airplane Land">Multi-Engine Airplane Land</SelectItem>
            <SelectItem value="Single-Engine Airplane Sea">Single-Engine Airplane Sea</SelectItem>
            <SelectItem value="Multi-Engine Airplane Sea">Multi-Engine Airplane Sea</SelectItem>
            <SelectItem value="Single-Engine Helicopter">Single-Engine Helicopter</SelectItem>
            <SelectItem value="Multi-Engine Helicopter">Multi-Engine Helicopter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">Save Changes</Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
      </div>
    </form>
  );
};

export default DataImportExport;