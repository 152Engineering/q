import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import RemindersSection from "./RemindersSection";
import UnitsTab from "./UnitsTab";

const pilotDetailsSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().optional(),
  region: z.enum(["New Zealand", "Australia", "United States", "Europe", "Asia"]),
  timezone: z.string().min(1, "Time zone is required"),
  date_format: z.string().min(1, "Date format is required"),
  currency: z.string().min(1, "Currency is required"),
  pilot_license: z.enum(["Student", "Ultralight Pilot", "Private Pilot", "Commercial Pilot", "Airline Pilot"]),
});

type PilotDetailsFormData = z.infer<typeof pilotDetailsSchema>;

const PilotDetailsTab = () => {
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const form = useForm<PilotDetailsFormData>({
    resolver: zodResolver(pilotDetailsSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone_number: "",
      region: "New Zealand",
      timezone: "",
      date_format: "",
      currency: "",
      pilot_license: "Student",
    },
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone_number, region, timezone, date_format, currency, pilot_license")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        form.reset({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          phone_number: profile.phone_number || "",
          region: profile.region,
          timezone: profile.timezone || "",
          date_format: profile.date_format || "",
          currency: profile.currency || "",
          pilot_license: profile.pilot_license || "Student",
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: PilotDetailsFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("user_id", user.id);

      if (error) throw error;

      // Reload user data to update form with saved values
      await loadUserData();

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const timezones = [
    "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Australia/Sydney",
    "Pacific/Auckland"
  ];

  const currencies = ["USD", "EUR", "GBP", "AUD", "NZD", "CAD", "JPY"];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Pilot Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter first name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter last name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label>Email Address</Label>
                  <Input value={userEmail} disabled className="bg-muted" />
                </div>

                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter phone number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="New Zealand">New Zealand</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Europe">Europe</SelectItem>
                          <SelectItem value="Asia">Asia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Zone</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time Format</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (European)</SelectItem>
                          <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pilot_license"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilot License</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select license type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Ultralight Pilot">Ultralight Pilot</SelectItem>
                          <SelectItem value="Private Pilot">Private Pilot</SelectItem>
                          <SelectItem value="Commercial Pilot">Commercial Pilot</SelectItem>
                          <SelectItem value="Airline Pilot">Airline Pilot</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
          </form>
        </Form>
      </CardContent>
    </Card>

    <UnitsTab />

    <RemindersSection />
    </div>
  );
};

export default PilotDetailsTab;