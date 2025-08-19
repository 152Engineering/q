import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const SecurityTab = () => {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDataLoading, setDeleteDataLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      
      form.reset();
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // First, delete user data from our tables
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete user's data
      await supabase.from("reminders").delete().eq("user_id", user.id);
      await supabase.from("aircraft").delete().eq("user_id", user.id);
      await supabase.from("crew").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);

      // Sign out the user
      await supabase.auth.signOut();

      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const deleteData = async () => {
    setDeleteDataLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete flights first (due to foreign key constraints)
      const { error: flightsError } = await supabase
        .from("flights")
        .delete()
        .eq("user_id", user.id);

      if (flightsError) throw flightsError;

      // Delete flight crew records
      const { error: flightCrewError } = await supabase
        .from("flight_crew")
        .delete()
        .in("flight_id", []);  // This will delete all flight_crew records for deleted flights

      // Delete aircraft
      const { error: aircraftError } = await supabase
        .from("aircraft")
        .delete()
        .eq("user_id", user.id);

      if (aircraftError) throw aircraftError;

      // Delete crew
      const { error: crewError } = await supabase
        .from("crew")
        .delete()
        .eq("user_id", user.id);

      if (crewError) throw crewError;

      toast({
        title: "Data Deleted",
        description: "All your aircraft, crew, and flight data have been permanently deleted. Your account and profile remain intact.",
      });

    } catch (error: any) {
      console.error("Error deleting data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete data",
        variant: "destructive",
      });
    } finally {
      setDeleteDataLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Enter new password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Confirm new password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Delete Data</h3>
              <p className="text-muted-foreground mb-4">
                Permanently delete all your aircraft, crew, and flight data. Your account and profile will remain intact. This action cannot be undone.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    Delete All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your data including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>All aircraft records</li>
                        <li>All crew members</li>
                        <li>All flight records and logbook entries</li>
                        <li>All flight crew assignments</li>
                      </ul>
                      <br />
                      Your account and profile information will remain intact, so you can continue using the app and start fresh.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteData}
                      disabled={deleteDataLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteDataLoading ? "Deleting..." : "Yes, delete all data"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Delete Account</h3>
              <p className="text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Profile information</li>
                        <li>Aircraft records</li>
                        <li>Crew members</li>
                        <li>Reminders and settings</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAccount}
                      disabled={deleteLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteLoading ? "Deleting..." : "Yes, delete my account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityTab;