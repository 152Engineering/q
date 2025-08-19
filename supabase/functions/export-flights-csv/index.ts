import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FlightExportData {
  flight_date: string
  aircraft_tail_number: string
  aircraft_type: string
  aircraft_manufacturer: string
  aircraft_model: string
  aircraft_category: string
  departure: string
  arrival: string
  flight_details: string | null
  user_role: string
  flight_rules: string
  flight_type: string
  day_night: string
  flight_time: number | null
  instrument_actual: number | null
  instrument_simulated: number | null
  instrument_ground: number | null
  takeoffs: number | null
  landings: number | null
  precision_approaches: number | null
  non_precision_approaches: number | null
  crew_first_name: string
  crew_last_name: string
  crew_role: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    console.log('Starting CSV export for flights...')

    // Get all flights with aircraft data
    const { data: flights, error: flightsError } = await supabaseClient
      .from('flights')
      .select(`
        *,
        aircraft (
          tail_number,
          manufacturer,
          model,
          aircraft_type,
          category
        )
      `)
      .order('flight_date', { ascending: false })

    if (flightsError) {
      console.error('Error fetching flights:', flightsError)
      throw flightsError
    }

    if (!flights || flights.length === 0) {
      console.log('No flights found for export')
      return new Response(
        JSON.stringify({ error: 'No flights found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Found ${flights.length} flights to export`)

    // Get all flight crew data
    const { data: flightCrew, error: crewError } = await supabaseClient
      .from('flight_crew')
      .select(`
        flight_id,
        role,
        is_self,
        crew_member_id,
        crew (
          first_name,
          last_name
        )
      `)

    if (crewError) {
      console.error('Error fetching flight crew:', crewError)
      throw crewError
    }

    console.log(`Found ${flightCrew?.length || 0} crew records`)

    // Get user profile for self identification
    const { data: { user } } = await supabaseClient.auth.getUser()
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user?.id)
      .single()

    // Process the data - create a row for each crew member per flight
    const exportData: FlightExportData[] = []
    
    flights.forEach(flight => {
      const flightCrewMembers = flightCrew?.filter(crew => crew.flight_id === flight.id) || []
      
      if (flightCrewMembers.length === 0) {
        // If no crew members, create a row with user as PIC
        exportData.push({
          flight_date: flight.flight_date,
          aircraft_tail_number: flight.aircraft?.tail_number || '',
          aircraft_type: flight.aircraft?.aircraft_type || '',
          aircraft_manufacturer: flight.aircraft?.manufacturer || '',
          aircraft_model: flight.aircraft?.model || '',
          aircraft_category: flight.aircraft?.category || '',
          departure: flight.departure,
          arrival: flight.arrival,
          flight_details: flight.flight_details,
          user_role: 'Pilot in Command',
          flight_rules: flight.flight_rules,
          flight_type: flight.flight_type,
          day_night: flight.day_night,
          flight_time: flight.flight_time,
          instrument_actual: flight.instrument_actual,
          instrument_simulated: flight.instrument_simulated,
          instrument_ground: flight.instrument_ground,
          takeoffs: flight.takeoffs,
          landings: flight.landings,
          precision_approaches: flight.precision_approaches,
          non_precision_approaches: flight.non_precision_approaches,
          crew_first_name: '',
          crew_last_name: '',
          crew_role: ''
        })
      } else {
        // Create a row for each crew member
        flightCrewMembers.forEach(crewMember => {
          let userRole = 'Pilot in Command' // Default role
          let crewFirstName = ''
          let crewLastName = ''
          let crewRole = ''
          
          if (crewMember.is_self) {
            // User is this crew member
            userRole = crewMember.role
            // Find other crew members for crew info
            const otherCrew = flightCrewMembers.find(c => !c.is_self)
            if (otherCrew) {
              crewRole = otherCrew.role
              if (otherCrew.crew) {
                crewFirstName = otherCrew.crew.first_name || ''
                crewLastName = otherCrew.crew.last_name || ''
              }
            }
          } else {
            // This is another crew member, user role comes from self crew member
            const selfCrew = flightCrewMembers.find(c => c.is_self)
            userRole = selfCrew?.role || 'Pilot in Command'
            crewRole = crewMember.role
            if (crewMember.crew) {
              crewFirstName = crewMember.crew.first_name || ''
              crewLastName = crewMember.crew.last_name || ''
            }
          }
          
          exportData.push({
            flight_date: flight.flight_date,
            aircraft_tail_number: flight.aircraft?.tail_number || '',
            aircraft_type: flight.aircraft?.aircraft_type || '',
            aircraft_manufacturer: flight.aircraft?.manufacturer || '',
            aircraft_model: flight.aircraft?.model || '',
            aircraft_category: flight.aircraft?.category || '',
            departure: flight.departure,
            arrival: flight.arrival,
            flight_details: flight.flight_details,
            user_role: userRole,
            flight_rules: flight.flight_rules,
            flight_type: flight.flight_type,
            day_night: flight.day_night,
            flight_time: flight.flight_time,
            instrument_actual: flight.instrument_actual,
            instrument_simulated: flight.instrument_simulated,
            instrument_ground: flight.instrument_ground,
            takeoffs: flight.takeoffs,
            landings: flight.landings,
            precision_approaches: flight.precision_approaches,
            non_precision_approaches: flight.non_precision_approaches,
            crew_first_name: crewFirstName,
            crew_last_name: crewLastName,
            crew_role: crewRole
          })
        })
      }
    })

    // Generate CSV headers
    const headers = [
      'Flight Date',
      'Aircraft Tail Number',
      'Aircraft Type',
      'Aircraft Manufacturer',
      'Aircraft Model', 
      'Aircraft Category',
      'Departure',
      'Arrival',
      'Flight Details',
      'User Role',
      'Flight Rules',
      'Flight Type',
      'Day/Night',
      'Flight Time',
      'Instrument Actual',
      'Instrument Simulated',
      'Instrument Ground',
      'Takeoffs',
      'Landings',
      'Precision Approaches',
      'Non-Precision Approaches',
      'Crew First Name',
      'Crew Last Name',
      'Crew Role'
    ]

    // Convert to CSV format
    const csvRows = [headers.join(',')]
    
    exportData.forEach(row => {
      const values = [
        row.flight_date,
        row.aircraft_tail_number,
        row.aircraft_type,
        row.aircraft_manufacturer,
        row.aircraft_model,
        row.aircraft_category,
        row.departure,
        row.arrival,
        `"${(row.flight_details || '').replace(/"/g, '""')}"`, // Escape quotes in flight details
        row.user_role,
        row.flight_rules,
        row.flight_type,
        row.day_night,
        row.flight_time || '',
        row.instrument_actual || '',
        row.instrument_simulated || '',
        row.instrument_ground || '',
        row.takeoffs || '',
        row.landings || '',
        row.precision_approaches || '',
        row.non_precision_approaches || '',
        row.crew_first_name,
        row.crew_last_name,
        row.crew_role
      ]
      csvRows.push(values.join(','))
    })

    const csvContent = csvRows.join('\n')
    console.log(`CSV export completed with ${exportData.length} flight records`)

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="flights-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Error in CSV export:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})