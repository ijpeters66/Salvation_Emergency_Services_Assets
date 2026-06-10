export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      app_user_profile: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string;
          action_type: string;
          record_type: string;
          record_id: string;
          old_value: Json | null;
          new_value: Json | null;
          device_source: string | null;
          offline_sync_reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_type: string;
          record_type: string;
          record_id: string;
          old_value?: Json | null;
          new_value?: Json | null;
          device_source?: string | null;
          offline_sync_reference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action_type?: string;
          record_type?: string;
          record_id?: string;
          old_value?: Json | null;
          new_value?: Json | null;
          device_source?: string | null;
          offline_sync_reference?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      permission: {
        Row: {
          id: string;
          key: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      role: {
        Row: {
          id: string;
          key: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      role_permission: {
        Row: {
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
          created_at?: string;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_is_system_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
