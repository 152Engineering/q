import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

interface Aircraft {
  hobbs_time?: number | null;
  tacho_time?: number | null;
  track_hobbs_tacho?: boolean;
  tail_number: string;
}

interface AircraftHoursSectionProps {
  aircraft: Aircraft | null;
  form: UseFormReturn<any>;
  flightTime: number | undefined;
  hobbsFieldName: string;
  tachoFieldName: string;
}

export const AircraftHoursSection = ({ 
  aircraft, 
  form, 
  flightTime, 
  hobbsFieldName, 
  tachoFieldName 
}: AircraftHoursSectionProps) => {
  // Only show if aircraft has tracking enabled
  if (!aircraft?.track_hobbs_tacho) {
    return null;
  }

  // Pre-populate hobbs end time when flight time changes
  const currentHobbs = aircraft.hobbs_time || 0;
  const calculatedHobbsEnd = flightTime ? currentHobbs + flightTime : currentHobbs;

  // Set the calculated value if the field is empty or zero
  const hobbsValue = form.watch(hobbsFieldName);
  if (flightTime && (!hobbsValue || hobbsValue === 0)) {
    form.setValue(hobbsFieldName, calculatedHobbsEnd);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aircraft Hours</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Current Hobbs: {aircraft.hobbs_time?.toFixed(1) || '0.0'}
            </p>
            <FormField
              control={form.control}
              name={hobbsFieldName}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hobbs End</FormLabel>
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

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Current Tacho: {aircraft.tacho_time?.toFixed(2) || '0.00'}
            </p>
            <FormField
              control={form.control}
              name={tachoFieldName}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tacho End</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
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
  );
};