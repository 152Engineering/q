import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

const crewSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
});

type CrewFormData = z.infer<typeof crewSchema>;

interface CrewMember {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

const CrewTab = () => {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null);

  const form = useForm<CrewFormData>({
    resolver: zodResolver(crewSchema),
  });

  useEffect(() => {
    loadCrew();
  }, []);

  const loadCrew = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("crew")
        .select("*")
        .eq("user_id", user.id)
        .order("first_name");

      if (error) throw error;
      setCrew(data || []);
    } catch (error) {
      console.error("Error loading crew:", error);
      toast({
        title: "Error",
        description: "Failed to load crew members",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: CrewFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingCrew) {
        const { error } = await supabase
          .from("crew")
          .update(data)
          .eq("id", editingCrew.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Crew member updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("crew")
          .insert({
            first_name: data.first_name,
            last_name: data.last_name,
            user_id: user.id,
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Crew member added successfully",
        });
      }

      setEditingCrew(null);
      form.reset();
      loadCrew();
    } catch (error) {
      console.error("Error saving crew member:", error);
      toast({
        title: "Error",
        description: "Failed to save crew member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCrew = async (id: string) => {
    try {
      const { error } = await supabase
        .from("crew")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Crew member deleted successfully",
      });
      loadCrew();
    } catch (error) {
      console.error("Error deleting crew member:", error);
      toast({
        title: "Error",
        description: "Failed to delete crew member",
        variant: "destructive",
      });
    }
  };

  const startEditing = (crewMember: CrewMember) => {
    setEditingCrew(crewMember);
    form.reset({
      first_name: crewMember.first_name,
      last_name: crewMember.last_name,
    });
  };

  const cancelEditing = () => {
    setEditingCrew(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Crew Member</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="flex justify-end space-x-2">
                {editingCrew && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingCrew ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crew Members</CardTitle>
        </CardHeader>
        <CardContent>
          {crew.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No crew members added yet. Use the form above to add your first crew member.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crew.map((crewMember) => (
                  <TableRow key={crewMember.id}>
                    <TableCell>{crewMember.first_name}</TableCell>
                    <TableCell>{crewMember.last_name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(crewMember)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCrew(crewMember.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CrewTab;