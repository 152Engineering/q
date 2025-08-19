import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Crown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  account_type: string;
  subscribed: boolean;
  subscription_end: string | null;
  free_trial_days_remaining: number;
  has_admin_override: boolean;
}

interface OverrideDialogState {
  isOpen: boolean;
  user: User | null;
  newAccountType: string;
  subscriptionActive: boolean;
}

const UserSubscriptionManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideDialog, setOverrideDialog] = useState<OverrideDialogState>({
    isOpen: false,
    user: null,
    newAccountType: 'Propeller',
    subscriptionActive: false,
  });
  const [processing, setProcessing] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .rpc('get_all_users_for_admin', { admin_user_id: session.user.id });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOverrideSubscription = async () => {
    if (!overrideDialog.user) return;
    
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .rpc('admin_override_subscription', {
          target_user_id: overrideDialog.user.user_id,
          new_account_type: overrideDialog.newAccountType,
          subscription_active: overrideDialog.subscriptionActive,
          admin_user_id: session.user.id,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Updated ${overrideDialog.user.first_name} ${overrideDialog.user.last_name}'s subscription`,
      });

      setOverrideDialog({ isOpen: false, user: null, newAccountType: 'Propeller', subscriptionActive: false });
      loadUsers(); // Reload users to see changes
    } catch (error) {
      console.error('Error overriding subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openOverrideDialog = (user: User) => {
    setOverrideDialog({
      isOpen: true,
      user,
      newAccountType: user.account_type,
      subscriptionActive: user.subscribed,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              User Subscription Management
            </CardTitle>
            <CardDescription>
              Override user subscription status and account types
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={user.account_type === 'Super Admin' ? 'default' : 'secondary'}>
                        {user.account_type}
                      </Badge>
                      <Badge variant={user.subscribed ? 'default' : 'outline'}>
                        {user.subscribed ? 'Subscribed' : 'Free'}
                      </Badge>
                      {user.has_admin_override && (
                        <Badge variant="destructive">
                          Admin Override
                        </Badge>
                      )}
                      {user.free_trial_days_remaining > 0 && 
                       user.account_type !== 'Super Admin' && 
                       !user.subscribed && 
                       !user.has_admin_override && (
                        <Badge variant="secondary">
                          {user.free_trial_days_remaining} days trial left
                        </Badge>
                      )}
                    </div>
                    {user.subscription_end && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(user.subscription_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {user.account_type !== 'Super Admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openOverrideDialog(user)}
                    >
                      Override
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={overrideDialog.isOpen} onOpenChange={(open) => !open && setOverrideDialog({ ...overrideDialog, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Subscription</DialogTitle>
            <DialogDescription>
              Update {overrideDialog.user?.first_name} {overrideDialog.user?.last_name}'s account type and subscription status.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-type">Account Type</Label>
              <Select
                value={overrideDialog.newAccountType}
                onValueChange={(value) => setOverrideDialog({ ...overrideDialog, newAccountType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Propeller">Propeller</SelectItem>
                  <SelectItem value="Turboprop">Turboprop</SelectItem>
                  <SelectItem value="Turbojet">Turbojet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="subscription-active"
                checked={overrideDialog.subscriptionActive}
                onCheckedChange={(checked) => setOverrideDialog({ ...overrideDialog, subscriptionActive: checked })}
              />
              <Label htmlFor="subscription-active">Active Subscription</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOverrideDialog({ ...overrideDialog, isOpen: false })}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleOverrideSubscription} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSubscriptionManagement;