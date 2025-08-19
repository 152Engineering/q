import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Edit, Trash2, Shield, Users, Database, ChevronDown } from "lucide-react";
import HeroSectionCMS from "@/components/cms/HeroSectionCMS";
import FeaturesSectionCMS from "@/components/cms/FeaturesSectionCMS";
import PricingSectionCMS from "@/components/cms/PricingSectionCMS";
import FooterSectionCMS from "@/components/cms/FooterSectionCMS";
import TermsPrivacyCMS from "@/components/cms/TermsPrivacyCMS";
import AboutUsCMS from "@/components/cms/AboutUsCMS";
import HelpCenterCMS from "@/components/cms/HelpCenterCMS";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import UserSubscriptionManagement from "@/components/UserSubscriptionManagement";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserData {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  account_type: string | null;
  subscribed: boolean;
  subscription_end: string | null;
  aircraft_count: number;
  flights_count: number;
  storage_used: number;
}

const AdminPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  // Check if user is Super Admin
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        console.log("🔍 Checking admin authorization...");
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.log("❌ No authenticated user found");
          navigate("/");
          return;
        }
        
        console.log("✅ User authenticated:", user.id, user.email);

        // Direct query to check Super Admin status
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("account_type, first_name, last_name")
          .eq("user_id", user.id)
          .single();

        console.log("📋 Profile query result:", { profile, error });

        if (error) {
          console.error("❌ Profile query error:", error);
          toast({
            title: "Access Denied",
            description: "Unable to verify admin permissions",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        if (!profile || profile.account_type !== "Super Admin") {
          console.log("❌ Not a Super Admin. Account type:", profile?.account_type);
          toast({
            title: "Access Denied", 
            description: "Super Admin privileges required to access the Admin Portal",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        console.log("✅ Super Admin access granted for:", profile.first_name, profile.last_name);
        setIsAuthorized(true);
      } catch (error) {
        console.error("❌ Authorization check failed:", error);
        toast({
          title: "Access Denied",
          description: "Failed to verify admin permissions",
          variant: "destructive", 
        });
        navigate("/");
      }
    };

    checkAuthorization();
  }, [navigate, toast]);

  // Fetch users data
  useEffect(() => {
    if (!isAuthorized) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        console.log("Starting to fetch users data...");
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('No authenticated user');
        }

        // Use the Super Admin function to get all users data
        console.log("Fetching all users for admin...");
        const { data: adminUsersData, error: usersError } = await supabase
          .rpc('get_all_users_for_admin', { admin_user_id: session.user.id });

        if (usersError) {
          console.error("Users error:", usersError);
          throw usersError;
        }
        console.log("Users fetched:", adminUsersData?.length || 0);

        // Get aircraft counts for each user
        console.log("Fetching aircraft counts...");
        const { data: aircraftData, error: aircraftError } = await supabase
          .from("aircraft")
          .select("user_id");
        
        const aircraftCounts: Record<string, number> = {};
        if (!aircraftError && aircraftData) {
          aircraftData.forEach(aircraft => {
            aircraftCounts[aircraft.user_id] = (aircraftCounts[aircraft.user_id] || 0) + 1;
          });
        }
        console.log("Aircraft counts calculated:", Object.keys(aircraftCounts).length);

        // Get flights counts for each user
        console.log("Fetching flights counts...");
        const { data: flightsData, error: flightsError } = await supabase
          .from("flights")
          .select("user_id");
        
        const flightsCounts: Record<string, number> = {};
        if (!flightsError && flightsData) {
          flightsData.forEach(flight => {
            flightsCounts[flight.user_id] = (flightsCounts[flight.user_id] || 0) + 1;
          });
        }
        console.log("Flight counts calculated:", Object.keys(flightsCounts).length);

        // Get storage usage
        console.log("Fetching storage usage...");
        const { data: storageData, error: storageError } = await supabase
          .rpc("get_user_storage_usage");
        
        const storageUsage: Record<string, number> = {};
        if (!storageError && storageData) {
          storageData.forEach((storage: any) => {
            // Convert bytes to MB
            storageUsage[storage.user_id] = Math.round((storage.storage_used_bytes || 0) / (1024 * 1024) * 100) / 100;
          });
        }
        console.log("Storage usage calculated:", Object.keys(storageUsage).length);

        // Combine all data into the UserData format
        console.log("Combining user data...");
        const combinedUsers: UserData[] = adminUsersData?.map((user: any) => ({
          user_id: user.user_id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone_number: null, // Not available in the admin function
          account_type: user.account_type || 'Propeller',
          subscribed: user.subscribed || false,
          subscription_end: user.subscription_end || null,
          aircraft_count: aircraftCounts[user.user_id] || 0,
          flights_count: flightsCounts[user.user_id] || 0,
          storage_used: storageUsage[user.user_id] || 0,
        })) || [];
        
        console.log("Final users data:", combinedUsers.length, "users");

        setUsers(combinedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({
          title: "Error",
          description: "Failed to load users data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAuthorized, toast]);

  const handleAccountTypeChange = async (userId: string, newAccountType: string) => {
    try {
      // Convert "none" to null for database storage
      const accountTypeValue = newAccountType === "none" ? null : newAccountType;
      
      const { error } = await supabase
        .from("profiles")
        .update({ account_type: accountTypeValue as any })
        .eq("user_id", userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.user_id === userId 
          ? { ...user, account_type: accountTypeValue }
          : user
      ));

      toast({
        title: "Success",
        description: "Account type updated successfully",
      });
    } catch (error) {
      console.error("Failed to update account type:", error);
      toast({
        title: "Error",
        description: "Failed to update account type",
        variant: "destructive",
      });
    }
  };

  const handleSubscriptionOverride = async (userId: string, override: boolean) => {
    try {
      const user = users.find(u => u.user_id === userId);
      if (!user) return;

      const { error } = await supabase
        .from("subscribers")
        .upsert({
          email: user.email,
          user_id: userId,
          subscribed: override,
          account_type: (user.account_type || "Propeller") as any,
          subscription_end: override ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      if (error) throw error;

      setUsers(users.map(user => 
        user.user_id === userId 
          ? { 
              ...user, 
              subscribed: override,
              subscription_end: override ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null
            }
          : user
      ));

      toast({
        title: "Success",
        description: `Subscription ${override ? "granted" : "revoked"} successfully`,
      });
    } catch (error) {
      console.error("Failed to update subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
        })
        .eq("user_id", editingUser.user_id);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.user_id === editingUser.user_id 
          ? { 
              ...user, 
              first_name: editForm.first_name,
              last_name: editForm.last_name,
            }
          : user
      ));

      setIsEditDialogOpen(false);
      setEditingUser(null);

      toast({
        title: "Success",
        description: "User information updated successfully",
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Error",
        description: "Failed to update user information",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Use the edge function to properly delete user from auth system
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { target_user_id: userId }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Remove from local state
      setUsers(users.filter(user => user.user_id !== userId));

      toast({
        title: "Success",
        description: "User and all associated data deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user completely",
        variant: "destructive",
      });
    }
  };

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Admin Portal</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="content">Site Content</TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading users...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Account Type</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Override</TableHead>
                        <TableHead>Aircraft</TableHead>
                        <TableHead>Flights</TableHead>
                        <TableHead>Storage</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone_number || "N/A"}</TableCell>
                          <TableCell>
                            <Select
                              value={user.account_type || "none"}
                              onValueChange={(value) => handleAccountTypeChange(user.user_id, value)}
                              disabled={user.account_type === "Super Admin"}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None (Free)</SelectItem>
                                <SelectItem value="Propeller">Propeller</SelectItem>
                                <SelectItem value="Turboprop">Turboprop</SelectItem>
                                <SelectItem value="Turbojet">Turbojet</SelectItem>
                                <SelectItem value="Super Admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={user.subscribed ? "default" : "secondary"}>
                                {user.subscribed ? "Active" : "Inactive"}
                              </Badge>
                              {user.subscription_end && (
                                <span className="text-xs text-muted-foreground">
                                  Until: {new Date(user.subscription_end).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={user.subscribed}
                              onCheckedChange={(checked) => handleSubscriptionOverride(user.user_id, checked)}
                              disabled={user.account_type === "Super Admin"}
                            />
                          </TableCell>
                          <TableCell>{user.aircraft_count}</TableCell>
                          <TableCell>{user.flights_count}</TableCell>
                          <TableCell>{user.storage_used} MB</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Edit User</DialogTitle>
                                    <DialogDescription>
                                      Make changes to the user's profile information here.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="first_name" className="text-right">
                                        First Name
                                      </Label>
                                      <Input
                                        id="first_name"
                                        value={editForm.first_name}
                                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                        className="col-span-3"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="last_name" className="text-right">
                                        Last Name
                                      </Label>
                                      <Input
                                        id="last_name"
                                        value={editForm.last_name}
                                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                        className="col-span-3"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="email" className="text-right">
                                        Email
                                      </Label>
                                      <Input
                                        id="email"
                                        value={editForm.email}
                                        disabled
                                        className="col-span-3 bg-muted"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button 
                                      type="button" 
                                      variant="outline"
                                      onClick={() => setIsEditDialogOpen(false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button type="submit" onClick={handleSaveUser}>
                                      Save changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    disabled={user.account_type === "Super Admin"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the user
                                      "{user.first_name} {user.last_name}" and remove their data from our servers.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteUser(user.user_id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <UserSubscriptionManagement />
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Site Content Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <h3 className="text-lg font-semibold">Home Page</h3>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 border rounded-lg mt-2">
                  <div className="space-y-6">
                    
                    {/* Hero Section */}
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-card border rounded-lg hover:bg-muted/50 transition-colors">
                        <h4 className="text-md font-medium">Hero Section</h4>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 mt-2">
                        <HeroSectionCMS />
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Features Section */}
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-card border rounded-lg hover:bg-muted/50 transition-colors">
                        <h4 className="text-md font-medium">Features Section</h4>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 mt-2">
                        <FeaturesSectionCMS />
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Pricing Section */}
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-card border rounded-lg hover:bg-muted/50 transition-colors">
                        <h4 className="text-md font-medium">Pricing Section</h4>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 mt-2">
                        <PricingSectionCMS />
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Footer Section */}
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-card border rounded-lg hover:bg-muted/50 transition-colors">
                        <h4 className="text-md font-medium">Footer Section</h4>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 mt-2">
                        <FooterSectionCMS />
                      </CollapsibleContent>
                    </Collapsible>

                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <h3 className="text-lg font-semibold">Terms of Service & Privacy Policy</h3>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 border rounded-lg mt-2">
                  <TermsPrivacyCMS />
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <h3 className="text-lg font-semibold">Help Center</h3>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 border rounded-lg mt-2">
                  <HelpCenterCMS />
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <h3 className="text-lg font-semibold">About Us Page</h3>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 border rounded-lg mt-2">
                  <AboutUsCMS />
                </CollapsibleContent>
              </Collapsible>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  API management features will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPortal;