export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      airbudget_integrations: {
        Row: {
          accounts_data: Json | null
          api_key: string
          created_at: string
          id: string
          is_connected: boolean
          selected_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accounts_data?: Json | null
          api_key: string
          created_at?: string
          id?: string
          is_connected?: boolean
          selected_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accounts_data?: Json | null
          api_key?: string
          created_at?: string
          id?: string
          is_connected?: boolean
          selected_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aircraft: {
        Row: {
          aircraft_photo_url: string | null
          aircraft_type: string
          average_fuel_burn: number | null
          category: Database["public"]["Enums"]["aircraft_category_type"]
          cost_per_hour: number | null
          created_at: string
          export_to_airbudget: boolean | null
          fuel_tank_capacity: number | null
          hobbs_time: number | null
          id: string
          manufacturer: string
          model: string
          tacho_time: number | null
          tail_number: string
          track_hobbs_tacho: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          aircraft_photo_url?: string | null
          aircraft_type: string
          average_fuel_burn?: number | null
          category: Database["public"]["Enums"]["aircraft_category_type"]
          cost_per_hour?: number | null
          created_at?: string
          export_to_airbudget?: boolean | null
          fuel_tank_capacity?: number | null
          hobbs_time?: number | null
          id?: string
          manufacturer: string
          model: string
          tacho_time?: number | null
          tail_number: string
          track_hobbs_tacho?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          aircraft_photo_url?: string | null
          aircraft_type?: string
          average_fuel_burn?: number | null
          category?: Database["public"]["Enums"]["aircraft_category_type"]
          cost_per_hour?: number | null
          created_at?: string
          export_to_airbudget?: boolean | null
          fuel_tank_capacity?: number | null
          hobbs_time?: number | null
          id?: string
          manufacturer?: string
          model?: string
          tacho_time?: number | null
          tail_number?: string
          track_hobbs_tacho?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aircraft_type_designators: {
        Row: {
          created_at: string
          id: string
          manufacturer: string
          model: string
          turbulence_category: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          manufacturer: string
          model: string
          turbulence_category?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manufacturer?: string
          model?: string
          turbulence_category?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      airport_ident: {
        Row: {
          created_at: string
          elevation_ft: number | null
          id: string
          ident: string
          iso_country: string | null
          name: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          elevation_ft?: number | null
          id?: string
          ident: string
          iso_country?: string | null
          name?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          elevation_ft?: number | null
          id?: string
          ident?: string
          iso_country?: string | null
          name?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cms_about_content: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_features: {
        Row: {
          created_at: string
          description: string
          display_order: number
          icon_class: string
          id: string
          is_active: boolean
          is_coming_soon: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          icon_class: string
          id?: string
          is_active?: boolean
          is_coming_soon?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon_class?: string
          id?: string
          is_active?: boolean
          is_coming_soon?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_features_header: {
        Row: {
          created_at: string
          heading: string
          id: string
          subheading: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          heading?: string
          id?: string
          subheading?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          heading?: string
          id?: string
          subheading?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_footer_links: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          link_text: string
          link_url: string
          section_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          link_text: string
          link_url: string
          section_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          link_text?: string
          link_url?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_help_articles: {
        Row: {
          content: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_help_faqs: {
        Row: {
          answer: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_hero_content: {
        Row: {
          background_image_url: string | null
          created_at: string
          heading: string
          id: string
          subheading: string
          updated_at: string
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string
          heading?: string
          id?: string
          subheading?: string
          updated_at?: string
        }
        Update: {
          background_image_url?: string | null
          created_at?: string
          heading?: string
          id?: string
          subheading?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_pricing_features: {
        Row: {
          created_at: string
          display_order: number
          feature_text: string
          id: string
          is_active: boolean
          plan_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          feature_text: string
          id?: string
          is_active?: boolean
          plan_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          feature_text?: string
          id?: string
          is_active?: boolean
          plan_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_pricing_header: {
        Row: {
          created_at: string
          heading: string
          id: string
          subheading: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          heading?: string
          id?: string
          subheading?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          heading?: string
          id?: string
          subheading?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_privacy_content: {
        Row: {
          content: string
          created_at: string
          id: string
          last_updated: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          last_updated?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          last_updated?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_terms_content: {
        Row: {
          content: string
          created_at: string
          id: string
          last_updated: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          last_updated?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          last_updated?: string
          updated_at?: string
        }
        Relationships: []
      }
      crew: {
        Row: {
          created_at: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flight_crew: {
        Row: {
          created_at: string
          crew_member_id: string | null
          flight_id: string | null
          id: string
          is_self: boolean | null
          role: string
        }
        Insert: {
          created_at?: string
          crew_member_id?: string | null
          flight_id?: string | null
          id?: string
          is_self?: boolean | null
          role: string
        }
        Update: {
          created_at?: string
          crew_member_id?: string | null
          flight_id?: string | null
          id?: string
          is_self?: boolean | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "flight_crew_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_crew_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
        ]
      }
      flights: {
        Row: {
          aircraft_hobbs_end: number | null
          aircraft_hobbs_start: number | null
          aircraft_id: string | null
          aircraft_tacho_end: number | null
          aircraft_tacho_start: number | null
          arrival: string
          arrival_country_code: string | null
          created_at: string
          day_night: string
          departure: string
          departure_country_code: string | null
          flight_date: string
          flight_details: string | null
          flight_rules: string
          flight_time: number | null
          flight_type: string
          id: string
          instrument_actual: number | null
          instrument_ground: number | null
          instrument_simulated: number | null
          landings: number | null
          non_precision_approaches: number | null
          precision_approaches: number | null
          status: string
          takeoffs: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aircraft_hobbs_end?: number | null
          aircraft_hobbs_start?: number | null
          aircraft_id?: string | null
          aircraft_tacho_end?: number | null
          aircraft_tacho_start?: number | null
          arrival: string
          arrival_country_code?: string | null
          created_at?: string
          day_night?: string
          departure: string
          departure_country_code?: string | null
          flight_date: string
          flight_details?: string | null
          flight_rules?: string
          flight_time?: number | null
          flight_type?: string
          id?: string
          instrument_actual?: number | null
          instrument_ground?: number | null
          instrument_simulated?: number | null
          landings?: number | null
          non_precision_approaches?: number | null
          precision_approaches?: number | null
          status?: string
          takeoffs?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aircraft_hobbs_end?: number | null
          aircraft_hobbs_start?: number | null
          aircraft_id?: string | null
          aircraft_tacho_end?: number | null
          aircraft_tacho_start?: number | null
          arrival?: string
          arrival_country_code?: string | null
          created_at?: string
          day_night?: string
          departure?: string
          departure_country_code?: string | null
          flight_date?: string
          flight_details?: string | null
          flight_rules?: string
          flight_time?: number | null
          flight_type?: string
          id?: string
          instrument_actual?: number | null
          instrument_ground?: number | null
          instrument_simulated?: number | null
          landings?: number | null
          non_precision_approaches?: number | null
          precision_approaches?: number | null
          status?: string
          takeoffs?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flights_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          currency: string | null
          date_format: string | null
          first_name: string
          free_trial_active: boolean | null
          free_trial_start: string | null
          id: string
          last_name: string
          phone_number: string | null
          pilot_license:
            | Database["public"]["Enums"]["pilot_license_type"]
            | null
          region: Database["public"]["Enums"]["region_type"]
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          volume_unit: string | null
          weight_unit: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          currency?: string | null
          date_format?: string | null
          first_name: string
          free_trial_active?: boolean | null
          free_trial_start?: string | null
          id?: string
          last_name: string
          phone_number?: string | null
          pilot_license?:
            | Database["public"]["Enums"]["pilot_license_type"]
            | null
          region: Database["public"]["Enums"]["region_type"]
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          volume_unit?: string | null
          weight_unit?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          currency?: string | null
          date_format?: string | null
          first_name?: string
          free_trial_active?: boolean | null
          free_trial_start?: string | null
          id?: string
          last_name?: string
          phone_number?: string | null
          pilot_license?:
            | Database["public"]["Enums"]["pilot_license_type"]
            | null
          region?: Database["public"]["Enums"]["region_type"]
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          volume_unit?: string | null
          weight_unit?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          due_date: string
          id: string
          item_type: Database["public"]["Enums"]["reminder_item_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          item_type: Database["public"]["Enums"]["reminder_item_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          item_type?: Database["public"]["Enums"]["reminder_item_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          email: string
          id: string
          monthly_billing: boolean
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email: string
          id?: string
          monthly_billing?: boolean
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email?: string
          id?: string
          monthly_billing?: boolean
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_user: {
        Args: { admin_user_id: string; target_user_id: string }
        Returns: boolean
      }
      admin_override_subscription: {
        Args: {
          admin_user_id: string
          new_account_type: string
          subscription_active: boolean
          target_user_id: string
        }
        Returns: boolean
      }
      get_all_users_for_admin: {
        Args: { admin_user_id: string }
        Returns: {
          account_type: string
          email: string
          first_name: string
          free_trial_days_remaining: number
          has_admin_override: boolean
          last_name: string
          subscribed: boolean
          subscription_end: string
          user_id: string
        }[]
      }
      get_user_access_level: {
        Args: { user_id_param: string }
        Returns: {
          account_type: string
          can_access_app: boolean
          free_trial_active: boolean
          free_trial_days_remaining: number
          has_admin_override: boolean
          has_subscription: boolean
          is_super_admin: boolean
        }[]
      }
      get_user_aircraft_count: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_emails_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          user_id: string
        }[]
      }
      get_user_flight_count_this_month: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_storage_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          storage_used_bytes: number
          user_id: string
        }[]
      }
      is_free_trial_active: {
        Args: { user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "Super Admin" | "Propeller" | "Turboprop" | "Turbojet"
      aircraft_category_type:
        | "Single-Engine Airplane Land"
        | "Multi-Engine Airplane Land"
        | "Single-Engine Airplane Sea"
        | "Multi-Engine Airplane Sea"
        | "Single-Engine Helicopter"
        | "Multi-Engine Helicopter"
      pilot_license_type:
        | "Student"
        | "Ultralight Pilot"
        | "Private Pilot"
        | "Commercial Pilot"
        | "Airline Pilot"
      region_type:
        | "New Zealand"
        | "Australia"
        | "United States"
        | "Europe"
        | "Asia"
      reminder_item_type:
        | "Medical Examination"
        | "Flight Check"
        | "IFR Proficiency Check"
        | "Theory Exam"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["Super Admin", "Propeller", "Turboprop", "Turbojet"],
      aircraft_category_type: [
        "Single-Engine Airplane Land",
        "Multi-Engine Airplane Land",
        "Single-Engine Airplane Sea",
        "Multi-Engine Airplane Sea",
        "Single-Engine Helicopter",
        "Multi-Engine Helicopter",
      ],
      pilot_license_type: [
        "Student",
        "Ultralight Pilot",
        "Private Pilot",
        "Commercial Pilot",
        "Airline Pilot",
      ],
      region_type: [
        "New Zealand",
        "Australia",
        "United States",
        "Europe",
        "Asia",
      ],
      reminder_item_type: [
        "Medical Examination",
        "Flight Check",
        "IFR Proficiency Check",
        "Theory Exam",
      ],
    },
  },
} as const
