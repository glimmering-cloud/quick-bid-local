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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bids: {
        Row: {
          created_at: string
          estimated_wait_minutes: number | null
          id: string
          message: string | null
          price: number
          provider_id: string
          request_id: string
          status: Database["public"]["Enums"]["bid_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_wait_minutes?: number | null
          id?: string
          message?: string | null
          price: number
          provider_id: string
          request_id: string
          status?: Database["public"]["Enums"]["bid_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_wait_minutes?: number | null
          id?: string
          message?: string | null
          price?: number
          provider_id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["bid_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address_revealed: boolean
          bid_id: string
          created_at: string
          customer_id: string
          final_price_chf: number | null
          id: string
          job_started: boolean
          job_started_at: string | null
          provider_id: string
          request_id: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          verification_pin: string | null
        }
        Insert: {
          address_revealed?: boolean
          bid_id: string
          created_at?: string
          customer_id: string
          final_price_chf?: number | null
          id?: string
          job_started?: boolean
          job_started_at?: string | null
          provider_id: string
          request_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          verification_pin?: string | null
        }
        Update: {
          address_revealed?: boolean
          bid_id?: string
          created_at?: string
          customer_id?: string
          final_price_chf?: number | null
          id?: string
          job_started?: boolean
          job_started_at?: string | null
          provider_id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          verification_pin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          assigned_to: string | null
          booking_id: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          created_at: string
          description: string
          id: string
          reported_user_id: string | null
          reporter_id: string
          resolution_note: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          booking_id?: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          created_at?: string
          description: string
          id?: string
          reported_user_id?: string | null
          reporter_id: string
          resolution_note?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string | null
          category?: Database["public"]["Enums"]["complaint_category"]
          created_at?: string
          description?: string
          id?: string
          reported_user_id?: string | null
          reporter_id?: string
          resolution_note?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          request_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          request_id: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          request_id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_fees: {
        Row: {
          created_at: string
          fee_amount: number
          fee_pct: number
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_ref: string | null
          period_month: string
          provider_id: string
          status: string
          total_earnings: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee_amount?: number
          fee_pct?: number
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          period_month: string
          provider_id: string
          status?: string
          total_earnings?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee_amount?: number
          fee_pct?: number
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          period_month?: string
          provider_id?: string
          status?: string
          total_earnings?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          base_price_chf: number | null
          business_name: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          provider_type: string
          rating: number | null
          service_category: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_price_chf?: number | null
          business_name: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider_type?: string
          rating?: number | null
          service_category?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_price_chf?: number | null
          business_name?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider_type?: string
          rating?: number | null
          service_category?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_payment_methods: {
        Row: {
          card_brand: string
          card_last_four: string
          cardholder_name: string
          created_at: string
          expiry_month: number
          expiry_year: number
          id: string
          is_default: boolean
          user_id: string
        }
        Insert: {
          card_brand?: string
          card_last_four: string
          cardholder_name: string
          created_at?: string
          expiry_month: number
          expiry_year: number
          id?: string
          is_default?: boolean
          user_id: string
        }
        Update: {
          card_brand?: string
          card_last_four?: string
          cardholder_name?: string
          created_at?: string
          expiry_month?: number
          expiry_year?: number
          id?: string
          is_default?: boolean
          user_id?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          category: string
          created_at: string
          customer_id: string
          description: string | null
          id: string
          location_lat: number
          location_lng: number
          location_name: string
          preferred_provider_type: string | null
          radius_km: number | null
          requested_time: string
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          location_lat: number
          location_lng: number
          location_name: string
          preferred_provider_type?: string | null
          radius_km?: number | null
          requested_time: string
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          location_lat?: number
          location_lng?: number
          location_name?: string
          preferred_provider_type?: string | null
          radius_km?: number | null
          requested_time?: string
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          bank_charges: number
          booking_id: string
          convenience_fee: number
          convenience_fee_pct: number
          created_at: string
          currency: string
          customer_id: string
          id: string
          payment_method: string
          provider_id: string
          provider_payout: number
          request_id: string
          service_amount: number
          status: string
          total_charged: number
          transaction_ref: string
        }
        Insert: {
          bank_charges?: number
          booking_id: string
          convenience_fee: number
          convenience_fee_pct?: number
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          payment_method?: string
          provider_id: string
          provider_payout: number
          request_id: string
          service_amount: number
          status?: string
          total_charged: number
          transaction_ref: string
        }
        Update: {
          bank_charges?: number
          booking_id?: string
          convenience_fee?: number
          convenience_fee_pct?: number
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          payment_method?: string
          provider_id?: string
          provider_payout?: number
          request_id?: string
          service_amount?: number
          status?: string
          total_charged?: number
          transaction_ref?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      find_matching_providers:
        | {
            Args: {
              radius_km?: number
              req_category: string
              req_lat: number
              req_lng: number
            }
            Returns: {
              business_name: string
              distance_km: number
              provider_user_id: string
            }[]
          }
        | {
            Args: {
              pref_provider_type?: string
              radius_km?: number
              req_category: string
              req_lat: number
              req_lng: number
            }
            Returns: {
              business_name: string
              distance_km: number
              provider_user_id: string
            }[]
          }
      get_booking_counterparty: {
        Args: { p_booking_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          masked_phone: string
        }[]
      }
      get_booking_location: {
        Args: { p_booking_id: string }
        Returns: {
          is_precise: boolean
          location_lat: number
          location_lng: number
          location_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "customer_service" | "moderator"
      bid_status: "pending" | "accepted" | "rejected" | "withdrawn"
      booking_status: "confirmed" | "completed" | "cancelled"
      complaint_category:
        | "service_quality"
        | "payment_dispute"
        | "no_show"
        | "inappropriate_behavior"
      complaint_status: "open" | "in_progress" | "resolved" | "dismissed"
      request_status:
        | "open"
        | "bidding"
        | "confirmed"
        | "completed"
        | "cancelled"
      user_role: "customer" | "provider"
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
      app_role: ["admin", "customer_service", "moderator"],
      bid_status: ["pending", "accepted", "rejected", "withdrawn"],
      booking_status: ["confirmed", "completed", "cancelled"],
      complaint_category: [
        "service_quality",
        "payment_dispute",
        "no_show",
        "inappropriate_behavior",
      ],
      complaint_status: ["open", "in_progress", "resolved", "dismissed"],
      request_status: [
        "open",
        "bidding",
        "confirmed",
        "completed",
        "cancelled",
      ],
      user_role: ["customer", "provider"],
    },
  },
} as const
