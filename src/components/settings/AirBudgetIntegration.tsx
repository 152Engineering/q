import { useState, useEffect } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, CreditCard, Building2 } from 'lucide-react';
import AccessRestriction from '../AccessRestriction';

interface AirBudgetAccount {
  id: string;
  name: string;
  account_type: string;
  account_use: string;
  current_balance: number;
  starting_balance: number;
  start_date: string;
  created_at: string;
}

const AirBudgetIntegration = () => {
  const { access } = useUserAccess();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<AirBudgetAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [hasSynced, setHasSynced] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const isTurbojetUser = (access.accountType === 'Turbojet' && access.hasSubscription) || access.isSuperAdmin;

  // Load saved data from database on component mount
  useEffect(() => {
    const loadIntegrationData = async () => {
      const { data: integrationData, error } = await supabase
        .from('airbudget_integrations')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error loading AirBudget integration:', error);
        return;
      }

      if (integrationData) {
        setApiKey(integrationData.api_key);
        setIsConnected(integrationData.is_connected);
        setHasSynced(true);
        setSelectedAccount(integrationData.selected_account_id);
        
        if (integrationData.accounts_data) {
          setAccounts(integrationData.accounts_data as unknown as AirBudgetAccount[]);
        }
      }
    };

    loadIntegrationData();
  }, []);

  const handleSync = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your AirBudget API key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Sync subscription data
      const subscriptionData = {
        subscription_tier: "Turbojet",
        subscription_status: "active",
        subscription_start: new Date().toISOString(),
        subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      };

      console.log('Syncing subscription data:', subscriptionData);

      const syncResponse = await fetch('https://xbqkstzvdmllpnzlkagv.supabase.co/functions/v1/api-subscription-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(subscriptionData),
      });

      console.log('Sync response status:', syncResponse.status);
      
      if (!syncResponse.ok) {
        const errorText = await syncResponse.text();
        console.error('Sync error response:', errorText);
        throw new Error(`Failed to sync subscription data: ${syncResponse.status} - ${errorText.substring(0, 200)}`);
      }

      const syncResult = await syncResponse.text();
      console.log('Sync response text:', syncResult);

      console.log('Subscription sync successful, fetching accounts...');

      // Step 2: Fetch accounts
      const accountsResponse = await fetch('https://xbqkstzvdmllpnzlkagv.supabase.co/functions/v1/api-accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });

      console.log('Accounts response status:', accountsResponse.status);

      if (!accountsResponse.ok) {
        const errorText = await accountsResponse.text();
        console.error('Accounts error response:', errorText);
        throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${errorText}`);
      }

      const accountsData = await accountsResponse.json();
      console.log('Accounts data received:', accountsData);
      console.log('Individual accounts:', accountsData.accounts?.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        current_balance: acc.current_balance,
        balanceType: typeof acc.current_balance
      })));
      
      setAccounts(accountsData.accounts || []);
      setHasSynced(true);
      setIsConnected(true);

      // Save to database
      const { error: saveError } = await supabase
        .from('airbudget_integrations')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          api_key: apiKey,
          accounts_data: accountsData.accounts || [],
          is_connected: true,
        });

      if (saveError) {
        console.error('Error saving integration data:', saveError);
        toast({
          title: "Warning",
          description: "Data synced but failed to save integration. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Successfully synced with AirBudget! Please select an account below.",
      });
    } catch (error) {
      console.error('AirBudget sync error:', error);
      toast({
        title: "Error",
        description: `Failed to sync with AirBudget: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAccount = async () => {
    if (!selectedAccount) {
      toast({
        title: "Error",
        description: "Please select an account first",
        variant: "destructive",
      });
      return;
    }

    // Save selected account to database
    const { error: updateError } = await supabase
      .from('airbudget_integrations')
      .update({ selected_account_id: selectedAccount })
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (updateError) {
      console.error('Error saving selected account:', updateError);
      toast({
        title: "Error",
        description: "Failed to save selected account. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const account = accounts.find(acc => acc.id === selectedAccount);
    toast({
      title: "Account Confirmed",
      description: `Successfully linked to ${account?.name}. Transaction sync will be available soon.`,
    });
  };

  const handleDisconnect = async () => {
    // Delete from database
    const { error: deleteError } = await supabase
      .from('airbudget_integrations')
      .delete()
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (deleteError) {
      console.error('Error disconnecting from AirBudget:', deleteError);
      toast({
        title: "Error",
        description: "Failed to disconnect from AirBudget. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setApiKey('');
    setAccounts([]);
    setSelectedAccount(null);
    setHasSynced(false);
    setIsConnected(false);

    toast({
      title: "Disconnected",
      description: "Successfully disconnected from AirBudget.",
    });
  };

  const formatCurrency = (amount: number | string, currency: string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const validAmount = isNaN(numericAmount) ? 0 : numericAmount;
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: currency || 'NZD',
    }).format(validAmount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          AirBudget API Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AccessRestriction
          isAllowed={isTurbojetUser}
          reason="subscription"
          requiredPlan="Turbojet"
        >
          <div className="space-y-4">
            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">Connected to AirBudget</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">AirBudget API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your AirBudget API key"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Generate an API key in your AirBudget account settings to connect the apps.
                  </p>
                </div>

                <Button 
                  onClick={handleSync}
                  disabled={isLoading || !apiKey.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing with AirBudget...
                    </>
                  ) : (
                    'Sync with AirBudget'
                  )}
                </Button>
              </>
            )}

            {hasSynced && accounts.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium mb-3">Select an Account</h4>
                  <div className="grid gap-3">
                    {accounts.map((account) => (
                      <Card 
                        key={account.id}
                        className={`cursor-pointer transition-colors ${
                          selectedAccount === account.id 
                            ? 'ring-2 ring-primary' 
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => setSelectedAccount(account.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-accent rounded-lg">
                                {account.account_use === 'business' ? (
                                  <Building2 className="h-4 w-4" />
                                ) : (
                                  <CreditCard className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{account.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {account.account_type} - {account.account_use}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatCurrency(account.current_balance, 'NZD')}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {account.account_type}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {selectedAccount && (
                  <Button 
                    onClick={handleConfirmAccount}
                    className="w-full"
                  >
                    Confirm Account
                  </Button>
                )}
              </div>
            )}

            {hasSynced && accounts.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No accounts found in your AirBudget account.
              </div>
            )}
          </div>
        </AccessRestriction>
      </CardContent>
    </Card>
  );
};

export default AirBudgetIntegration;