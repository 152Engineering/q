import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserRequest {
  target_user_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's session for regular operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Create admin client for user deletion
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the current user to verify they're authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    console.log('Delete request from user:', user.id);

    // Verify the user is a Super Admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.account_type !== 'Super Admin') {
      throw new Error('Access denied. Super Admin required.');
    }

    // Parse request body
    const { target_user_id }: DeleteUserRequest = await req.json();

    if (!target_user_id) {
      throw new Error('target_user_id is required');
    }

    console.log('Attempting to delete user:', target_user_id);

    // Check if target user is also a Super Admin (prevent deletion)
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('user_id', target_user_id)
      .single();

    if (!targetProfileError && targetProfile?.account_type === 'Super Admin') {
      throw new Error('Cannot delete Super Admin users.');
    }

    // Delete user data in the correct order (respecting foreign key constraints)
    console.log('Deleting flight crew records...');
    const { error: flightCrewError } = await supabase
      .from('flight_crew')
      .delete()
      .in('flight_id', 
        supabase.from('flights').select('id').eq('user_id', target_user_id)
      );

    if (flightCrewError) {
      console.error('Error deleting flight crew:', flightCrewError);
    }

    console.log('Deleting flights...');
    const { error: flightsError } = await supabase
      .from('flights')
      .delete()
      .eq('user_id', target_user_id);

    if (flightsError) {
      console.error('Error deleting flights:', flightsError);
    }

    console.log('Deleting aircraft...');
    const { error: aircraftError } = await supabase
      .from('aircraft')
      .delete()
      .eq('user_id', target_user_id);

    if (aircraftError) {
      console.error('Error deleting aircraft:', aircraftError);
    }

    console.log('Deleting crew...');
    const { error: crewError } = await supabase
      .from('crew')
      .delete()
      .eq('user_id', target_user_id);

    if (crewError) {
      console.error('Error deleting crew:', crewError);
    }

    console.log('Deleting reminders...');
    const { error: remindersError } = await supabase
      .from('reminders')
      .delete()
      .eq('user_id', target_user_id);

    if (remindersError) {
      console.error('Error deleting reminders:', remindersError);
    }

    console.log('Deleting subscribers record...');
    const { error: subscribersError } = await supabase
      .from('subscribers')
      .delete()
      .eq('user_id', target_user_id);

    if (subscribersError) {
      console.error('Error deleting subscribers:', subscribersError);
    }

    console.log('Deleting profile...');
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', target_user_id);

    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError);
    }

    // Finally delete from auth.users using admin client
    console.log('Deleting from auth.users...');
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);

    if (authDeleteError) {
      console.error('Error deleting from auth.users:', authDeleteError);
      throw new Error(`Failed to delete user from auth system: ${authDeleteError.message}`);
    }

    console.log('User deleted successfully:', target_user_id);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in admin-delete-user function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});