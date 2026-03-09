export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string;
          role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "CUSTOMER";
          salon_id: string | null;
          profile_image: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          phone?: string;
          role?: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "CUSTOMER";
          salon_id?: string | null;
          profile_image?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          phone?: string;
          role?: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "CUSTOMER";
          salon_id?: string | null;
          profile_image?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          customer_id: string;
          service: string;
          date: string;
          time: string;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          service: string;
          date: string;
          time: string;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          service?: string;
          date?: string;
          time?: string;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      designer_instagram_tokens: {
        Row: {
          id: string;
          designer_id: string;
          instagram_user_id: string;
          access_token: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          designer_id: string;
          instagram_user_id: string;
          access_token: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          designer_id?: string;
          instagram_user_id?: string;
          access_token?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
