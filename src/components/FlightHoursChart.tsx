import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, TrendingUp } from "lucide-react";

interface FlightData {
  id: string;
  flight_time: number;
  flight_date: string;
  departure_country_code?: string;
  arrival_country_code?: string;
  aircraft: {
    tail_number: string;
    aircraft_type: string;
    category: string;
  };
}

interface ChartDataPoint {
  period: string;
  hours: number;
  date?: string;
}

interface Aircraft {
  tail_number: string;
  aircraft_type: string;
  category: string;
}

type TimePeriod = 'day' | '90days' | 'month' | 'alltime';

interface FlightHoursChartProps {
  selectedTailNumber: string;
  selectedType: string;
  selectedCategory: string;
  selectedCountry: string;
}

const FlightHoursChart = ({ selectedTailNumber, selectedType, selectedCategory, selectedCountry }: FlightHoursChartProps) => {
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch flights
      const { data: flightsData, error: flightsError } = await supabase
        .from("flights")
        .select(`
          id,
          flight_time,
          flight_date,
          departure_country_code,
          arrival_country_code,
          aircraft (tail_number, aircraft_type, category)
        `)
        .eq("status", "complete")
        .not("flight_time", "is", null)
        .order("flight_date", { ascending: true });

      if (flightsError) throw flightsError;

      setFlights(flightsData as FlightData[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const chartData = useMemo(() => {
    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (timePeriod === 'day') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayFlights = filteredFlights.filter(flight => 
          flight.flight_date === dateString
        );
        
        const totalHours = dayFlights.reduce((sum, flight) => sum + (flight.flight_time || 0), 0);
        
        data.push({
          period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          hours: Math.round(totalHours * 10) / 10,
          date: dateString
        });
      }
    } else if (timePeriod === '90days') {
      // Last 90 days (weekly aggregation)
      for (let i = 12; i >= 0; i--) {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        
        const startDateString = startDate.toISOString().split('T')[0];
        const endDateString = endDate.toISOString().split('T')[0];
        
        const weekFlights = filteredFlights.filter(flight => 
          flight.flight_date >= startDateString && flight.flight_date <= endDateString
        );
        
        const totalHours = weekFlights.reduce((sum, flight) => sum + (flight.flight_time || 0), 0);
        
        data.push({
          period: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          hours: Math.round(totalHours * 10) / 10
        });
      }
    } else if (timePeriod === 'alltime') {
      // All time (yearly aggregation)
      if (filteredFlights.length > 0) {
        const sortedFlights = [...filteredFlights].sort((a, b) => 
          new Date(a.flight_date).getTime() - new Date(b.flight_date).getTime()
        );
        
        const firstFlightYear = new Date(sortedFlights[0].flight_date).getFullYear();
        const currentYear = new Date().getFullYear();
        
        for (let year = firstFlightYear; year <= currentYear; year++) {
          const yearFlights = filteredFlights.filter(flight => {
            const flightDate = new Date(flight.flight_date);
            return flightDate.getFullYear() === year;
          });
          
          const totalHours = yearFlights.reduce((sum, flight) => sum + (flight.flight_time || 0), 0);
          
          data.push({
            period: year.toString(),
            hours: Math.round(totalHours * 10) / 10
          });
        }
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const monthFlights = filteredFlights.filter(flight => {
          const flightDate = new Date(flight.flight_date);
          return flightDate.getFullYear() === year && flightDate.getMonth() + 1 === month;
        });
        
        const totalHours = monthFlights.reduce((sum, flight) => sum + (flight.flight_time || 0), 0);
        
        data.push({
          period: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          hours: Math.round(totalHours * 10) / 10
        });
      }
    }

    return data;
  }, [filteredFlights, timePeriod]);


  const totalHours = useMemo(() => {
    return filteredFlights.reduce((sum, flight) => sum + (flight.flight_time || 0), 0);
  }, [filteredFlights]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Flight Hours Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading chart data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Flight Hours Chart
          </CardTitle>
          
          {/* Time Period Filter */}
          <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="month">Last 12 Months</SelectItem>
              <SelectItem value="alltime">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-4 mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm font-medium">
              {timePeriod === 'day' ? 'Last 30 Days' : 
               timePeriod === '90days' ? 'Last 90 Days' : 
               timePeriod === 'alltime' ? 'All Time' : 
               'Last 12 Months'}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium">Total Hours:</span> {totalHours.toFixed(1)}h
          </div>
          <div className="text-sm">
            <span className="font-medium">Flights:</span> {filteredFlights.length}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                angle={timePeriod === 'day' || timePeriod === '90days' ? -45 : 0}
                textAnchor={timePeriod === 'day' || timePeriod === '90days' ? 'end' : 'middle'}
                height={timePeriod === 'day' || timePeriod === '90days' ? 60 : 30}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value}h`, 'Flight Hours']}
                labelFormatter={(label: string) => `Period: ${label}`}
              />
              <Bar 
                dataKey="hours" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightHoursChart;