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
      asset: {
        Row: {
          id: string;
          unique_asset_id: string;
          qr_code_value: string;
          asset_name: string;
          category_id: string;
          description: string | null;
          serial_number: string | null;
          make: string | null;
          model: string | null;
          purchase_date: string | null;
          purchase_cost: number | null;
          replacement_value: number | null;
          current_value: number | null;
          current_location_id: string;
          status: string;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          unique_asset_id: string;
          qr_code_value: string;
          asset_name: string;
          category_id: string;
          description?: string | null;
          serial_number?: string | null;
          make?: string | null;
          model?: string | null;
          purchase_date?: string | null;
          purchase_cost?: number | null;
          replacement_value?: number | null;
          current_value?: number | null;
          current_location_id: string;
          status: string;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          unique_asset_id?: string;
          qr_code_value?: string;
          asset_name?: string;
          category_id?: string;
          description?: string | null;
          serial_number?: string | null;
          make?: string | null;
          model?: string | null;
          purchase_date?: string | null;
          purchase_cost?: number | null;
          replacement_value?: number | null;
          current_value?: number | null;
          current_location_id?: string;
          status?: string;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      asset_assignment: {
        Row: {
          id: string;
          parent_asset_id: string;
          child_asset_id: string;
          assigned_at: string;
          unassigned_at: string | null;
          assigned_by: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          parent_asset_id: string;
          child_asset_id: string;
          assigned_at?: string;
          unassigned_at?: string | null;
          assigned_by: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          parent_asset_id?: string;
          child_asset_id?: string;
          assigned_at?: string;
          unassigned_at?: string | null;
          assigned_by?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      asset_category: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      asset_movement: {
        Row: {
          id: string;
          asset_id: string;
          from_location_id: string | null;
          to_location_id: string | null;
          from_status: string | null;
          to_status: string;
          reason: string;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          from_location_id?: string | null;
          to_location_id?: string | null;
          from_status?: string | null;
          to_status: string;
          reason: string;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          from_location_id?: string | null;
          to_location_id?: string | null;
          from_status?: string | null;
          to_status?: string;
          reason?: string;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
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
      consumable_category: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      consumable_item: {
        Row: {
          id: string;
          name: string;
          category_id: string;
          description: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          name: string;
          category_id: string;
          description?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          name?: string;
          category_id?: string;
          description?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      consumable_batch: {
        Row: {
          id: string;
          item_id: string;
          batch_lot_number: string;
          quantity_received: number;
          quantity_on_hand: number;
          unit_cost: number | null;
          replacement_cost: number | null;
          date_received: string;
          supplier_donor: string | null;
          expiry_date: string | null;
          location_id: string;
          qr_code_value: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          batch_lot_number: string;
          quantity_received: number;
          quantity_on_hand: number;
          unit_cost?: number | null;
          replacement_cost?: number | null;
          date_received: string;
          supplier_donor?: string | null;
          expiry_date?: string | null;
          location_id: string;
          qr_code_value: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          batch_lot_number?: string;
          quantity_received?: number;
          quantity_on_hand?: number;
          unit_cost?: number | null;
          replacement_cost?: number | null;
          date_received?: string;
          supplier_donor?: string | null;
          expiry_date?: string | null;
          location_id?: string;
          qr_code_value?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      deployment: {
        Row: {
          id: string;
          deployment_id: string;
          deployment_name: string;
          purpose_reason: string;
          deployment_location_site: string;
          team_name: string;
          team_leader: string | null;
          contact_number: string | null;
          start_datetime: string;
          expected_return_datetime: string | null;
          actual_return_datetime: string | null;
          status: string;
          notes: string | null;
          damage_fault_notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deployment_id: string;
          deployment_name: string;
          purpose_reason: string;
          deployment_location_site: string;
          team_name: string;
          team_leader?: string | null;
          contact_number?: string | null;
          start_datetime: string;
          expected_return_datetime?: string | null;
          actual_return_datetime?: string | null;
          status?: string;
          notes?: string | null;
          damage_fault_notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deployment_id?: string;
          deployment_name?: string;
          purpose_reason?: string;
          deployment_location_site?: string;
          team_name?: string;
          team_leader?: string | null;
          contact_number?: string | null;
          start_datetime?: string;
          expected_return_datetime?: string | null;
          actual_return_datetime?: string | null;
          status?: string;
          notes?: string | null;
          damage_fault_notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deployment_asset: {
        Row: {
          id: string;
          deployment_id: string;
          asset_id: string;
          checked_out_at: string;
          checked_in_at: string | null;
          checked_out_by: string;
          checked_in_by: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          deployment_id: string;
          asset_id: string;
          checked_out_at?: string;
          checked_in_at?: string | null;
          checked_out_by: string;
          checked_in_by?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          deployment_id?: string;
          asset_id?: string;
          checked_out_at?: string;
          checked_in_at?: string | null;
          checked_out_by?: string;
          checked_in_by?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      deployment_consumable: {
        Row: {
          id: string;
          deployment_id: string;
          consumable_batch_id: string;
          stock_movement_id: string;
          quantity: number;
          issued_at: string;
          issued_by: string;
        };
        Insert: {
          id?: string;
          deployment_id: string;
          consumable_batch_id: string;
          stock_movement_id: string;
          quantity: number;
          issued_at?: string;
          issued_by: string;
        };
        Update: {
          id?: string;
          deployment_id?: string;
          consumable_batch_id?: string;
          stock_movement_id?: string;
          quantity?: number;
          issued_at?: string;
          issued_by?: string;
        };
        Relationships: [];
      };
      location: {
        Row: {
          id: string;
          name: string;
          type: string;
          address: string | null;
          state: string;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          address?: string | null;
          state?: string;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          address?: string | null;
          state?: string;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      maintenance_record: {
        Row: {
          id: string;
          asset_id: string;
          maintenance_schedule_id: string | null;
          date: string;
          service_type: string;
          description: string;
          cost: number;
          supplier_provider: string;
          odometer_hour_reading: number | null;
          notes: string | null;
          attachment_metadata: Json[];
          recorded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          maintenance_schedule_id?: string | null;
          date: string;
          service_type: string;
          description: string;
          cost?: number;
          supplier_provider: string;
          odometer_hour_reading?: number | null;
          notes?: string | null;
          attachment_metadata?: Json[];
          recorded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          maintenance_schedule_id?: string | null;
          date?: string;
          service_type?: string;
          description?: string;
          cost?: number;
          supplier_provider?: string;
          odometer_hour_reading?: number | null;
          notes?: string | null;
          attachment_metadata?: Json[];
          recorded_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      maintenance_schedule: {
        Row: {
          id: string;
          asset_id: string;
          maintenance_type: string;
          service_interval_date: number | null;
          service_interval_odometer: number | null;
          service_interval_hours: number | null;
          next_service_due_date: string | null;
          next_service_due_reading: number | null;
          service_provider: string | null;
          reminder_threshold_days: number | null;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          maintenance_type: string;
          service_interval_date?: number | null;
          service_interval_odometer?: number | null;
          service_interval_hours?: number | null;
          next_service_due_date?: string | null;
          next_service_due_reading?: number | null;
          service_provider?: string | null;
          reminder_threshold_days?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          maintenance_type?: string;
          service_interval_date?: number | null;
          service_interval_odometer?: number | null;
          service_interval_hours?: number | null;
          next_service_due_date?: string | null;
          next_service_due_reading?: number | null;
          service_provider?: string | null;
          reminder_threshold_days?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          updated_by?: string;
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
      plant_details: {
        Row: {
          asset_id: string;
          registration_number: string | null;
          registration_expiry: string | null;
          insurance_expiry: string | null;
          roadworthy_compliance_date: string | null;
          odometer_reading: number | null;
          hour_meter_reading: number | null;
          fuel_type: string | null;
          service_provider: string | null;
          created_at: string;
          updated_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          asset_id: string;
          registration_number?: string | null;
          registration_expiry?: string | null;
          insurance_expiry?: string | null;
          roadworthy_compliance_date?: string | null;
          odometer_reading?: number | null;
          hour_meter_reading?: number | null;
          fuel_type?: string | null;
          service_provider?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          asset_id?: string;
          registration_number?: string | null;
          registration_expiry?: string | null;
          insurance_expiry?: string | null;
          roadworthy_compliance_date?: string | null;
          odometer_reading?: number | null;
          hour_meter_reading?: number | null;
          fuel_type?: string | null;
          service_provider?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          updated_by?: string;
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
      stock_movement: {
        Row: {
          id: string;
          consumable_batch_id: string;
          movement_type: string;
          quantity: number;
          from_location_id: string | null;
          to_location_id: string | null;
          reason: string;
          related_deployment_id: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          consumable_batch_id: string;
          movement_type: string;
          quantity: number;
          from_location_id?: string | null;
          to_location_id?: string | null;
          reason: string;
          related_deployment_id?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          consumable_batch_id?: string;
          movement_type?: string;
          quantity?: number;
          from_location_id?: string | null;
          to_location_id?: string | null;
          reason?: string;
          related_deployment_id?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      stock_threshold: {
        Row: {
          id: string;
          consumable_item_id: string;
          location_id: string;
          minimum_quantity: number;
          created_at: string;
          updated_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          consumable_item_id: string;
          location_id: string;
          minimum_quantity: number;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          consumable_item_id?: string;
          location_id?: string;
          minimum_quantity?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          updated_by?: string;
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
