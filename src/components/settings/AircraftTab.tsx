import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Plane } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";

const aircraftSchema = z.object({
  tail_number: z.string().min(1, "Tail number is required"),
  aircraft_type: z.string().min(1, "Aircraft type is required").max(4, "Aircraft type must be 4 characters or less"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  model: z.string().min(1, "Model is required"),
  category: z.enum([
    "Single-Engine Airplane Land",
    "Multi-Engine Airplane Land",
    "Single-Engine Airplane Sea",
    "Multi-Engine Airplane Sea",
    "Single-Engine Helicopter",
    "Multi-Engine Helicopter"
  ]),
  hobbs_time: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().optional()
  ),
  tacho_time: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().optional()
  ),
  cost_per_hour: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0, "Cost must be positive").optional()
  ),
  fuel_tank_capacity: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0, "Fuel tank capacity must be positive").optional()
  ),
  average_fuel_burn: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().min(0, "Average fuel burn must be positive").optional()
  ),
  export_to_airbudget: z.boolean().default(false),
  track_hobbs_tacho: z.boolean().default(false),
}).refine((data) => {
  // Make hobbs_time required if track_hobbs_tacho is true
  if (data.track_hobbs_tacho && (data.hobbs_time === undefined || data.hobbs_time === null)) {
    return false;
  }
  return true;
}, {
  message: "Hobbs time is required when tracking is enabled",
  path: ["hobbs_time"]
}).refine((data) => {
  // Make tacho_time required if track_hobbs_tacho is true
  if (data.track_hobbs_tacho && (data.tacho_time === undefined || data.tacho_time === null)) {
    return false;
  }
  return true;
}, {
  message: "Tacho time is required when tracking is enabled",
  path: ["tacho_time"]
});

type AircraftFormData = z.infer<typeof aircraftSchema>;

interface Aircraft {
  id: string;
  tail_number: string;
  aircraft_type: string;
  manufacturer: string;
  model: string;
  category: string;
  hobbs_time?: number;
  tacho_time?: number;
  cost_per_hour?: number;
  fuel_tank_capacity?: number;
  average_fuel_burn?: number;
  export_to_airbudget: boolean;
  track_hobbs_tacho?: boolean;
  aircraft_photo_url?: string;
}

const AircraftTab = () => {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userVolumeUnit, setUserVolumeUnit] = useState<string>("Liters");
  const [isLookingUpType, setIsLookingUpType] = useState(false);

  const form = useForm<AircraftFormData>({
    resolver: zodResolver(aircraftSchema),
    defaultValues: {
      hobbs_time: undefined,
      tacho_time: undefined,
      cost_per_hour: undefined,
      fuel_tank_capacity: undefined,
      average_fuel_burn: undefined,
      export_to_airbudget: false,
      track_hobbs_tacho: false,
    },
  });

  const watchExportToAirbudget = form.watch("export_to_airbudget");
  const watchTrackHobbsTacho = form.watch("track_hobbs_tacho");

  useEffect(() => {
    loadAircraft();
    loadUserProfile();
  }, []);

  const toProperCase = (text: string): string => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const lookupAircraftType = async (aircraftType: string) => {
    if (!aircraftType.trim()) return;
    
    setIsLookingUpType(true);
    try {
      const { data, error } = await supabase
        .from('aircraft_type_designators')
        .select('manufacturer, model')
        .eq('type', aircraftType.toUpperCase())
        .maybeSingle();

      if (error) {
        console.error('Error looking up aircraft type:', error);
        return;
      }

      if (data) {
        form.setValue('manufacturer', toProperCase(data.manufacturer));
        form.setValue('model', toProperCase(data.model));
        toast({
          title: "Aircraft type found",
          description: `Auto-populated manufacturer and model for ${aircraftType}`,
        });
      }
    } catch (error) {
      console.error('Error during aircraft type lookup:', error);
    } finally {
      setIsLookingUpType(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("volume_unit")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (data?.volume_unit) {
        setUserVolumeUnit(data.volume_unit);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadAircraft = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("aircraft")
        .select("*")
        .eq("user_id", user.id)
        .order("tail_number");

      if (error) throw error;
      setAircraft(data || []);
    } catch (error) {
      console.error("Error loading aircraft:", error);
      toast({
        title: "Error",
        description: "Failed to load aircraft",
        variant: "destructive",
      });
    }
  };

  const uploadFile = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('aircraft-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('aircraft-photos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const onSubmit = async (data: AircraftFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let photoUrl = editingAircraft?.aircraft_photo_url;
      
      if (selectedFile) {
        setUploading(true);
        photoUrl = await uploadFile(selectedFile, user.id);
        setUploading(false);
      }

      if (editingAircraft) {
        const { error } = await supabase
          .from("aircraft")
          .update({
            tail_number: data.tail_number,
            aircraft_type: data.aircraft_type,
            manufacturer: data.manufacturer,
            model: data.model,
            category: data.category,
            hobbs_time: data.hobbs_time,
            tacho_time: data.tacho_time,
            cost_per_hour: data.cost_per_hour,
            fuel_tank_capacity: data.fuel_tank_capacity,
            average_fuel_burn: data.average_fuel_burn,
            export_to_airbudget: data.export_to_airbudget,
            track_hobbs_tacho: data.track_hobbs_tacho,
            aircraft_photo_url: photoUrl,
          })
          .eq("id", editingAircraft.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Aircraft updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("aircraft")
          .insert({
            tail_number: data.tail_number,
            aircraft_type: data.aircraft_type,
            manufacturer: data.manufacturer,
            model: data.model,
            category: data.category,
            hobbs_time: data.hobbs_time,
            tacho_time: data.tacho_time,
            cost_per_hour: data.cost_per_hour,
            fuel_tank_capacity: data.fuel_tank_capacity,
            average_fuel_burn: data.average_fuel_burn,
            export_to_airbudget: data.export_to_airbudget,
            track_hobbs_tacho: data.track_hobbs_tacho,
            aircraft_photo_url: photoUrl,
            user_id: user.id,
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Aircraft added successfully",
        });
      }

      setDialogOpen(false);
      setEditingAircraft(null);
      setSelectedFile(null);
      form.reset();
      loadAircraft();
    } catch (error) {
      console.error("Error saving aircraft:", error);
      toast({
        title: "Error",
        description: "Failed to save aircraft",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAircraft = async (id: string) => {
    try {
      const { error } = await supabase
        .from("aircraft")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Aircraft deleted successfully",
      });
      loadAircraft();
    } catch (error) {
      console.error("Error deleting aircraft:", error);
      toast({
        title: "Error",
        description: "Failed to delete aircraft",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (aircraftItem: Aircraft) => {
    setEditingAircraft(aircraftItem);
    form.reset({
      tail_number: aircraftItem.tail_number,
      aircraft_type: aircraftItem.aircraft_type,
      manufacturer: aircraftItem.manufacturer,
      model: aircraftItem.model,
      category: aircraftItem.category as any,
      hobbs_time: aircraftItem.hobbs_time,
      tacho_time: aircraftItem.tacho_time,
      cost_per_hour: aircraftItem.cost_per_hour,
      fuel_tank_capacity: aircraftItem.fuel_tank_capacity,
      average_fuel_burn: aircraftItem.average_fuel_burn,
      export_to_airbudget: aircraftItem.export_to_airbudget,
      track_hobbs_tacho: aircraftItem.track_hobbs_tacho,
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingAircraft(null);
    form.reset({
      hobbs_time: undefined,
      tacho_time: undefined,
      cost_per_hour: undefined,
      fuel_tank_capacity: undefined,
      average_fuel_burn: undefined,
      export_to_airbudget: false,
      track_hobbs_tacho: false,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Aircraft</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Aircraft
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAircraft ? "Edit Aircraft" : "Add New Aircraft"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tail_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tail #</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., N123AB" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aircraft_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aircraft Type</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., C172, P28A" 
                            maxLength={4}
                            onChange={(e) => {
                              field.onChange(e);
                              // Debounce the lookup to avoid too many API calls
                              const timer = setTimeout(() => {
                                lookupAircraftType(e.target.value);
                              }, 500);
                              return () => clearTimeout(timer);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        {isLookingUpType && (
                          <p className="text-sm text-muted-foreground">Looking up aircraft type...</p>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufacturer</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Cessna" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Skyhawk" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select aircraft category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Single-Engine Airplane Land">Single-Engine Airplane Land</SelectItem>
                            <SelectItem value="Multi-Engine Airplane Land">Multi-Engine Airplane Land</SelectItem>
                            <SelectItem value="Single-Engine Airplane Sea">Single-Engine Airplane Sea</SelectItem>
                            <SelectItem value="Multi-Engine Airplane Sea">Multi-Engine Airplane Sea</SelectItem>
                            <SelectItem value="Single-Engine Helicopter">Single-Engine Helicopter</SelectItem>
                            <SelectItem value="Multi-Engine Helicopter">Multi-Engine Helicopter</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="track_hobbs_tacho"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 md:col-span-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Track Hobbs & Tacho Time</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {watchTrackHobbsTacho && (
                    <>
                      <FormField
                        control={form.control}
                        name="hobbs_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hobbs Time</FormLabel>
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
                        name="tacho_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tacho Time</FormLabel>
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
                    </>
                  )}

                   <FormField
                     control={form.control}
                     name="fuel_tank_capacity"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Fuel Tank Capacity (per tank) - {userVolumeUnit}</FormLabel>
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
                     name="average_fuel_burn"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Average Fuel Burn - {userVolumeUnit}/hr</FormLabel>
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

                    <div className="md:col-span-2">
                      <Label>Aircraft Photo</Label>
                      <Input 
                        type="file" 
                        accept="image/jpeg,image/png" 
                        className="mt-1"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload JPG/PNG images. Photos will be stored in original quality.
                      </p>
                    </div>

                  <FormField
                    control={form.control}
                    name="export_to_airbudget"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 md:col-span-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Export flight expenses to AirBudget?</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {watchExportToAirbudget && (
                    <FormField
                      control={form.control}
                      name="cost_per_hour"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Cost per Hour</FormLabel>
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
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingAircraft ? "Update" : "Add"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {aircraft.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plane className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No aircraft added yet. Click "Add Aircraft" to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aircraft.map((aircraftItem) => (
            <Card key={aircraftItem.id} className="relative">
              <div className="w-full h-32 overflow-hidden rounded-t-lg">
                {aircraftItem.aircraft_photo_url ? (
                  <img 
                    src={aircraftItem.aircraft_photo_url} 
                    alt={`${aircraftItem.tail_number} aircraft`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Plane className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader className="pt-4">
                <CardTitle className="flex items-center justify-between">
                  <span>{aircraftItem.tail_number}</span>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(aircraftItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAircraft(aircraftItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Type:</strong> {aircraftItem.aircraft_type}</p>
                  <p><strong>Make/Model:</strong> {aircraftItem.manufacturer} {aircraftItem.model}</p>
                  <p><strong>Category:</strong> {aircraftItem.category}</p>
                  {aircraftItem.track_hobbs_tacho && aircraftItem.hobbs_time && (
                    <p><strong>Hobbs:</strong> {aircraftItem.hobbs_time.toFixed(1)}</p>
                  )}
                  {aircraftItem.track_hobbs_tacho && aircraftItem.tacho_time && (
                    <p><strong>Tacho:</strong> {aircraftItem.tacho_time.toFixed(2)}</p>
                  )}
                  {aircraftItem.cost_per_hour && (
                    <p><strong>Cost/Hour:</strong> ${aircraftItem.cost_per_hour.toFixed(2)}</p>
                  )}
                </div>
                
                {/* Status Labels */}
                <div className="mt-4 pt-3 border-t space-y-1">
                  {aircraftItem.track_hobbs_tacho && (
                    <p className="text-primary font-medium text-sm">✓ Hobbs & Tacho Tracking Enabled</p>
                  )}
                  {aircraftItem.export_to_airbudget && (
                    <p className="text-primary font-medium text-sm">✓ AirBudget Export Enabled</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AircraftTab;