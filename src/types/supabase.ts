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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          additional_charges: number | null
          booking_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          customer_id: string
          customer_notes: string | null
          designer_id: string
          discount: number | null
          duration_minutes: number
          end_time: string
          id: string
          line_notification_sent: boolean
          line_notification_sent_at: string | null
          paid_at: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          salon_id: string
          service_id: string
          service_price: number
          staff_notes: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          additional_charges?: number | null
          booking_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          designer_id: string
          discount?: number | null
          duration_minutes: number
          end_time: string
          id?: string
          line_notification_sent?: boolean
          line_notification_sent_at?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          salon_id: string
          service_id: string
          service_price: number
          staff_notes?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          additional_charges?: number | null
          booking_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          designer_id?: string
          discount?: number | null
          duration_minutes?: number
          end_time?: string
          id?: string
          line_notification_sent?: boolean
          line_notification_sent_at?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          salon_id?: string
          service_id?: string
          service_price?: number
          staff_notes?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          created_at: string
          last_visit_at: string | null
          line_display_name: string | null
          line_picture_url: string | null
          line_status_message: string | null
          line_user_id: string | null
          marketing_consent: boolean
          notes: string | null
          preferences: Json | null
          preferred_designer_id: string | null
          preferred_salon_id: string | null
          total_bookings: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_visit_at?: string | null
          line_display_name?: string | null
          line_picture_url?: string | null
          line_status_message?: string | null
          line_user_id?: string | null
          marketing_consent?: boolean
          notes?: string | null
          preferences?: Json | null
          preferred_designer_id?: string | null
          preferred_salon_id?: string | null
          total_bookings?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_visit_at?: string | null
          line_display_name?: string | null
          line_picture_url?: string | null
          line_status_message?: string | null
          line_user_id?: string | null
          marketing_consent?: boolean
          notes?: string | null
          preferences?: Json | null
          preferred_designer_id?: string | null
          preferred_salon_id?: string | null
          total_bookings?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_preferred_designer_id_fkey"
            columns: ["preferred_designer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_profiles_preferred_salon_id_fkey"
            columns: ["preferred_salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      designer_instagram_tokens: {
        Row: {
          id: string
          designer_id: string
          instagram_user_id: string
          access_token: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          designer_id: string
          instagram_user_id: string
          access_token: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          designer_id?: string
          instagram_user_id?: string
          access_token?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      industries: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          customer_id: string
          designer_id: string
          id: string
          images: string[] | null
          is_visible: boolean
          rating: number
          responded_at: string | null
          response: string | null
          response_by: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          designer_id: string
          id?: string
          images?: string[] | null
          is_visible?: boolean
          rating: number
          responded_at?: string | null
          response?: string | null
          response_by?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          designer_id?: string
          id?: string
          images?: string[] | null
          is_visible?: boolean
          rating?: number
          responded_at?: string | null
          response?: string | null
          response_by?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_response_by_fkey"
            columns: ["response_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_images: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          salon_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          salon_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_images_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_industries: {
        Row: {
          display_order: number | null
          id: string
          industry_id: string | null
          salon_id: string | null
        }
        Insert: {
          display_order?: number | null
          id?: string
          industry_id?: string | null
          salon_id?: string | null
        }
        Update: {
          display_order?: number | null
          id?: string
          industry_id?: string | null
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_industries_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_industries_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          address: string
          approval_status: Database["public"]["Enums"]["approval_status_type"]
          approved_at: string | null
          business_hours: Json | null
          city: string
          country: string
          cover_image_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          email: string | null
          holidays: Json | null
          id: string
          is_active: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string
          plan_type: string
          postal_code: string | null
          rejected_reason: string | null
          settings: Json | null
          state: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address: string
          approval_status?: Database["public"]["Enums"]["approval_status_type"]
          approved_at?: string | null
          business_hours?: Json | null
          city: string
          country?: string
          cover_image_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          holidays?: Json | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone: string
          plan_type?: string
          postal_code?: string | null
          rejected_reason?: string | null
          settings?: Json | null
          state?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          approval_status?: Database["public"]["Enums"]["approval_status_type"]
          approved_at?: string | null
          business_hours?: Json | null
          city?: string
          country?: string
          cover_image_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          holidays?: Json | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string
          plan_type?: string
          postal_code?: string | null
          rejected_reason?: string | null
          settings?: Json | null
          state?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          display_order: number
          id: string
          industry_id: string | null
          is_active: boolean
          name: string
          name_en: string | null
          name_th: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          industry_id?: string | null
          is_active?: boolean
          name: string
          name_en?: string | null
          name_th?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          industry_id?: string | null
          is_active?: boolean
          name?: string
          name_en?: string | null
          name_th?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_categories_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      service_position_prices: {
        Row: {
          created_at: string
          id: string
          position_id: string
          price: number
          pricing_type: string
          service_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          position_id: string
          price: number
          pricing_type?: string
          service_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          position_id?: string
          price?: number
          pricing_type?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_position_prices_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "staff_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_position_prices_service_id_pricing_type_fkey"
            columns: ["service_id", "pricing_type"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id", "pricing_type"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number | null
          category_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          display_order: number
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          name_en: string | null
          name_th: string | null
          pricing_type: string
          salon_id: string
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_order?: number
          duration_minutes: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          name_en?: string | null
          name_th?: string | null
          pricing_type?: string
          salon_id: string
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_order?: number
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          name_en?: string | null
          name_th?: string | null
          pricing_type?: string
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_positions: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          level: number
          name: string
          name_en: string | null
          name_th: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          level?: number
          name: string
          name_en?: string | null
          name_th?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          name_en?: string | null
          name_th?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_positions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          created_at: string
          created_by: string | null
          holidays: Json | null
          is_approved: boolean
          is_booking_enabled: boolean
          is_owner: boolean
          permissions: Json
          position_id: string | null
          salon_id: string
          social_links: Json | null
          specialties: string[] | null
          updated_at: string
          user_id: string
          work_schedule: Json | null
          years_of_experience: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          created_at?: string
          created_by?: string | null
          holidays?: Json | null
          is_approved?: boolean
          is_booking_enabled?: boolean
          is_owner?: boolean
          permissions?: Json
          position_id?: string | null
          salon_id: string
          social_links?: Json | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
          work_schedule?: Json | null
          years_of_experience?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          created_at?: string
          created_by?: string | null
          holidays?: Json | null
          is_approved?: boolean
          is_booking_enabled?: boolean
          is_owner?: boolean
          permissions?: Json
          position_id?: string | null
          salon_id?: string
          social_links?: Json | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
          work_schedule?: Json | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "staff_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_provider: Database["public"]["Enums"]["auth_provider"]
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          profile_image: string | null
          provider_user_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          auth_provider?: Database["public"]["Enums"]["auth_provider"]
          created_at?: string
          deleted_at?: string | null
          email: string
          id: string
          is_active?: boolean
          name: string
          phone?: string | null
          profile_image?: string | null
          provider_user_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          auth_provider?: Database["public"]["Enums"]["auth_provider"]
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          profile_image?: string | null
          provider_user_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_my_salon_id: { Args: never; Returns: string }
    }
    Enums: {
      approval_status_type: "pending" | "approved" | "rejected"
      auth_provider: "EMAIL" | "LINE" | "GOOGLE" | "KAKAO"
      booking_status:
        | "PENDING"
        | "CONFIRMED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW"
      payment_status: "PENDING" | "PAID" | "REFUNDED" | "FAILED"
      user_role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "CUSTOMER"
      user_type: "ADMIN_USER" | "CUSTOMER"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      approval_status_type: ["pending", "approved", "rejected"],
      auth_provider: ["EMAIL", "LINE", "GOOGLE", "KAKAO"],
      booking_status: [
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      payment_status: ["PENDING", "PAID", "REFUNDED", "FAILED"],
      user_role: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "CUSTOMER"],
      user_type: ["ADMIN_USER", "CUSTOMER"],
    },
  },
} as const
