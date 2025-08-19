import { supabase } from "@/integrations/supabase/client";

interface FlightData {
  flight_date: string;
  departure: string;
  arrival: string;
  flight_time: number;
  aircraft_id: string;
}

interface Aircraft {
  id: string;
  cost_per_hour?: number | null;
  export_to_airbudget: boolean;
}

export const createAirBudgetTransaction = async (flightData: FlightData, aircraft: Aircraft) => {
  // Only proceed if aircraft has AirBudget export enabled and cost per hour set
  if (!aircraft.export_to_airbudget || !aircraft.cost_per_hour || !flightData.flight_time) {
    return;
  }

  let integrationData: any = null;

  try {
    // Get AirBudget integration data
    const { data, error: integrationError } = await supabase
      .from('airbudget_integrations')
      .select('*')
      .maybeSingle();

    integrationData = data;

    if (integrationError || !integrationData || !integrationData.selected_account_id) {
      console.log('No AirBudget integration found or no account selected', {
        error: integrationError,
        hasData: !!integrationData,
        hasAccount: !!integrationData?.selected_account_id
      });
      return;
    }

    // Calculate cost
    const cost = aircraft.cost_per_hour * flightData.flight_time;

    // Prepare transaction data
    const transactionData = {
      account_id: integrationData.selected_account_id,
      name: `${flightData.departure} to ${flightData.arrival}`,
      amount: -cost, // Negative for expense
      transaction_type: "expense",
      category: "Transportation",
      transaction_date: flightData.flight_date,
      repeats: false
    };

    console.log('Creating AirBudget transaction:', transactionData);

    // Make the API call to AirBudget
    const response = await fetch('https://xbqkstzvdmllpnzlkagv.supabase.co/functions/v1/api-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': integrationData.api_key,
      },
      body: JSON.stringify(transactionData)
    });

    console.log('AirBudget API response status:', response.status);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.text();
        errorMessage += `: ${errorData}`;
        console.error('AirBudget API Error Response:', errorData);
      } catch (e) {
        errorMessage += `: ${response.statusText}`;
      }
      throw new Error(`Failed to create AirBudget transaction: ${errorMessage}`);
    }

    const result = await response.json();
    console.log('AirBudget transaction created successfully:', result);
    return true;
  } catch (error) {
    console.error('Error creating AirBudget transaction:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      hasIntegrationData: !!integrationData,
      selectedAccount: integrationData?.selected_account_id,
      hasApiKey: !!integrationData?.api_key,
      flightData,
      aircraft: {
        id: aircraft.id,
        export_to_airbudget: aircraft.export_to_airbudget,
        cost_per_hour: aircraft.cost_per_hour
      }
    });
    // Don't throw error to avoid disrupting flight save
    return false;
  }
};