import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FlightData {
  aircraftId: string;
  aircraftInfo: {
    tailNumber: string;
    type: string;
    hobbsStart: number;
    fuelCapacity?: number;
    fuelBurnRate?: number;
  };
  route: {
    departure: string;
    arrival: string;
  };
  flightDate: Date;
  startTime: Date;
  flightRules?: string;
  fuelTracking?: {
    enabled: boolean;
    leftTankStart: number;
    rightTankStart: number;
    startingTank: string;
    changeFrequency: number;
    tankSelectEnabled?: boolean;
  };
  crew?: Array<{
    crew_member_id?: string;
    is_self: boolean;
    role: string;
    crew_member?: {
      first_name: string;
      last_name: string;
    };
  }>;
}

interface FlightContextType {
  isFlightActive: boolean;
  flightData: FlightData | null;
  isModalVisible: boolean;
  isModalMinimized: boolean;
  flightTime: string;
  currentTank: string;
  leftFuel: number;
  rightFuel: number;
  fuelCapacity: number;
  nextTankChangeMinutes: number;
  nextTankChangeSeconds: number;
  isTankChangeOverdue: boolean;
  tankChangeOverdueDuration: number;
  imcTime: string;
  isImcActive: boolean;
  startFlight: (data: FlightData) => void;
  endFlight: () => void;
  toggleModalVisibility: () => void;
  toggleModalMinimized: () => void;
  switchTank: () => void;
  startImcTimer: () => void;
  pauseImcTimer: () => void;
  resetImcTimer: () => void;
}

const FlightContext = createContext<FlightContextType | undefined>(undefined);

export const useFlightContext = () => {
  const context = useContext(FlightContext);
  if (!context) {
    throw new Error("useFlightContext must be used within a FlightProvider");
  }
  return context;
};

export const FlightProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isFlightActive, setIsFlightActive] = useState(false);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalMinimized, setIsModalMinimized] = useState(false);
  const [flightTime, setFlightTime] = useState("00:00:00");
  const [currentTank, setCurrentTank] = useState("Left Tank");
  const [leftFuel, setLeftFuel] = useState(0);
  const [rightFuel, setRightFuel] = useState(0);
  const [fuelCapacity, setFuelCapacity] = useState(0);
  const [initialLeftFuel, setInitialLeftFuel] = useState(0);
  const [initialRightFuel, setInitialRightFuel] = useState(0);
  const [lastTankChangeTime, setLastTankChangeTime] = useState<Date | null>(null);
  const [nextTankChangeMinutes, setNextTankChangeMinutes] = useState(0);
  const [nextTankChangeSeconds, setNextTankChangeSeconds] = useState(0);
  const [isTankChangeOverdue, setIsTankChangeOverdue] = useState(false);
  const [tankChangeOverdueDuration, setTankChangeOverdueDuration] = useState(0);
  const [imcTime, setImcTime] = useState("00:00:00");
  const [isImcActive, setIsImcActive] = useState(false);
  const [imcStartTime, setImcStartTime] = useState<Date | null>(null);
  const [totalImcTime, setTotalImcTime] = useState(0);
  const [currentFlightId, setCurrentFlightId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFlightActive || !flightData) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - flightData.startTime.getTime();
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setFlightTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      
      // Update IMC timer if active
      if (isImcActive && imcStartTime) {
        const imcElapsed = totalImcTime + (Date.now() - imcStartTime.getTime());
        const imcHours = Math.floor(imcElapsed / 3600000);
        const imcMinutes = Math.floor((imcElapsed % 3600000) / 60000);
        const imcSeconds = Math.floor((imcElapsed % 60000) / 1000);
        setImcTime(`${imcHours.toString().padStart(2, '0')}:${imcMinutes.toString().padStart(2, '0')}:${imcSeconds.toString().padStart(2, '0')}`);
      }
      
      // Update fuel consumption if fuel tracking is enabled
      if (flightData.fuelTracking?.enabled && flightData.aircraftInfo.fuelBurnRate) {
        const elapsedHours = elapsed / (1000 * 60 * 60); // Convert to hours
        const totalFuelBurned = elapsedHours * flightData.aircraftInfo.fuelBurnRate;
        
        // Calculate fuel remaining based on current tank
        if (currentTank === "Both") {
          // Both tanks: split fuel consumption equally
          const halfBurnRate = totalFuelBurned / 2;
          const newLeftFuel = Math.max(0, initialLeftFuel - halfBurnRate);
          const newRightFuel = Math.max(0, initialRightFuel - halfBurnRate);
          setLeftFuel(newLeftFuel);
          setRightFuel(newRightFuel);
        } else if (currentTank === "Left Tank") {
          const newLeftFuel = Math.max(0, initialLeftFuel - totalFuelBurned);
          setLeftFuel(newLeftFuel);
          setRightFuel(initialRightFuel); // Right tank unchanged
        } else {
          const newRightFuel = Math.max(0, initialRightFuel - totalFuelBurned);
          setRightFuel(newRightFuel);
          setLeftFuel(initialLeftFuel); // Left tank unchanged
        }

        // Only show tank change countdown if tank select is enabled
        if (flightData.fuelTracking.tankSelectEnabled && currentTank !== "Both") {
          // Calculate next tank change countdown
          const changeFrequencyMs = flightData.fuelTracking.changeFrequency * 60 * 1000;
          const timeSinceLastChange = lastTankChangeTime 
            ? Date.now() - lastTankChangeTime.getTime()
            : elapsed;
          
          const timeUntilNextChange = changeFrequencyMs - timeSinceLastChange;
          
          // Handle overdue state
          if (timeUntilNextChange <= 0) {
            setNextTankChangeMinutes(0);
            setNextTankChangeSeconds(0);
            setIsTankChangeOverdue(true);
            setTankChangeOverdueDuration(Math.abs(timeUntilNextChange));
          } else {
            const minutesUntilChange = Math.floor(timeUntilNextChange / (60 * 1000));
            const secondsUntilChange = Math.floor((timeUntilNextChange % (60 * 1000)) / 1000);
            setNextTankChangeMinutes(minutesUntilChange);
            setNextTankChangeSeconds(secondsUntilChange);
            setIsTankChangeOverdue(false);
            setTankChangeOverdueDuration(0);
          }
        } else {
          // Reset tank change state when not using tank select
          setNextTankChangeMinutes(0);
          setNextTankChangeSeconds(0);
          setIsTankChangeOverdue(false);
          setTankChangeOverdueDuration(0);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isFlightActive, flightData, currentTank, initialLeftFuel, initialRightFuel, lastTankChangeTime, isImcActive, imcStartTime, totalImcTime]);

  const startFlight = useCallback(async (data: FlightData) => {
    try {
      // Create incomplete flight record in database
      const { data: flight, error } = await supabase
        .from('flights')
        .insert({
          aircraft_id: data.aircraftId,
          departure: data.route.departure,
          arrival: data.route.arrival,
          flight_date: data.flightDate.toISOString().split('T')[0],
          aircraft_hobbs_start: data.aircraftInfo.hobbsStart,
          status: 'incomplete',
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating flight record:', error);
        return;
      }

      // Insert crew members
      if (data.crew && data.crew.length > 0) {
        const crewInserts = data.crew.map(crewMember => ({
          flight_id: flight.id,
          crew_member_id: crewMember.is_self ? null : crewMember.crew_member_id,
          is_self: crewMember.is_self,
          role: crewMember.role
        }));

        const { error: crewError } = await supabase
          .from('flight_crew')
          .insert(crewInserts);

        if (crewError) {
          console.error('Error creating crew records:', crewError);
        }
      }

      setCurrentFlightId(flight.id);
      setFlightData(data);
      setIsFlightActive(true);
      setIsModalVisible(true);
      setIsModalMinimized(false);
      setFlightTime("00:00:00");
      
      // Set fuel data from flight data
      if (data.fuelTracking?.enabled) {
        setCurrentTank(data.fuelTracking.startingTank);
        setLeftFuel(data.fuelTracking.leftTankStart);
        setRightFuel(data.fuelTracking.rightTankStart);
        setInitialLeftFuel(data.fuelTracking.leftTankStart);
        setInitialRightFuel(data.fuelTracking.rightTankStart);
        setFuelCapacity(data.aircraftInfo.fuelCapacity || 0);
        setLastTankChangeTime(null); // Start with no previous tank change
        setNextTankChangeMinutes(data.fuelTracking.changeFrequency);
        setNextTankChangeSeconds(0);
        setIsTankChangeOverdue(false);
      } else {
        setCurrentTank("Left Tank");
        setLeftFuel(0);
        setRightFuel(0);
        setInitialLeftFuel(0);
        setInitialRightFuel(0);
        setFuelCapacity(0);
        setLastTankChangeTime(null);
        setNextTankChangeMinutes(0);
        setNextTankChangeSeconds(0);
        setIsTankChangeOverdue(false);
        setTankChangeOverdueDuration(0);
      }
    } catch (error) {
      console.error('Error starting flight:', error);
    }
  }, []);

  const endFlight = useCallback(() => {
    if (currentFlightId) {
      // Store the current flight ID and timer values for the save flight page
      sessionStorage.setItem('currentFlightId', currentFlightId);
      sessionStorage.setItem('flightTime', flightTime);
      sessionStorage.setItem('imcTime', imcTime);
    }
    
    setIsFlightActive(false);
    setFlightData(null);
    setIsModalVisible(false);
    setIsModalMinimized(false);
    setFlightTime("00:00:00");
    setImcTime("00:00:00");
    setIsImcActive(false);
    setImcStartTime(null);
    setTotalImcTime(0);
    setCurrentFlightId(null);
    
    // Navigate to save flight page
    window.location.href = '/app/save-flight';
  }, [currentFlightId, flightTime, imcTime]);

  const toggleModalVisibility = useCallback(() => {
    setIsModalVisible(prev => !prev);
    if (isModalMinimized) {
      setIsModalMinimized(false);
    }
  }, [isModalMinimized]);

  const toggleModalMinimized = useCallback(() => {
    setIsModalMinimized(prev => !prev);
  }, []);

  const switchTank = useCallback(() => {
    if (!flightData?.fuelTracking?.enabled) return;
    
    // When switching tanks, we need to update the fuel burn calculation
    // based on what was consumed from the current tank up to this point
    const elapsed = Date.now() - flightData.startTime.getTime();
    const elapsedHours = elapsed / (1000 * 60 * 60);
    const fuelBurnRate = flightData.aircraftInfo.fuelBurnRate || 0;
    const totalFuelBurned = elapsedHours * fuelBurnRate;
    
    // Record the time of this tank change and reset timer
    setLastTankChangeTime(new Date());
    setIsTankChangeOverdue(false);
    setTankChangeOverdueDuration(0);
    
    // Immediately reset the countdown timer to the full frequency duration
    if (flightData.fuelTracking.changeFrequency) {
      setNextTankChangeMinutes(flightData.fuelTracking.changeFrequency);
      setNextTankChangeSeconds(0);
    }
    
    if (currentTank === "Left Tank") {
      // Switch to right tank, save current left tank fuel consumption
      const newLeftFuel = Math.max(0, initialLeftFuel - totalFuelBurned);
      setLeftFuel(newLeftFuel);
      setInitialLeftFuel(newLeftFuel);
      setCurrentTank("Right Tank");
    } else {
      // Switch to left tank, save current right tank fuel consumption  
      const newRightFuel = Math.max(0, initialRightFuel - totalFuelBurned);
      setRightFuel(newRightFuel);
      setInitialRightFuel(newRightFuel);
      setCurrentTank("Left Tank");
    }
  }, [currentTank, flightData, initialLeftFuel, initialRightFuel]);

  const startImcTimer = useCallback(() => {
    if (!isImcActive) {
      setIsImcActive(true);
      setImcStartTime(new Date());
    }
  }, [isImcActive]);

  const pauseImcTimer = useCallback(() => {
    if (isImcActive && imcStartTime) {
      const elapsed = Date.now() - imcStartTime.getTime();
      setTotalImcTime(prev => prev + elapsed);
      setIsImcActive(false);
      setImcStartTime(null);
    }
  }, [isImcActive, imcStartTime]);

  const resetImcTimer = useCallback(() => {
    setImcTime("00:00:00");
    setIsImcActive(false);
    setImcStartTime(null);
    setTotalImcTime(0);
  }, []);

  const value: FlightContextType = {
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
    startFlight,
    endFlight,
    toggleModalVisibility,
    toggleModalMinimized,
    switchTank,
    startImcTimer,
    pauseImcTimer,
    resetImcTimer,
  };

  return (
    <FlightContext.Provider value={value}>
      {children}
    </FlightContext.Provider>
  );
};