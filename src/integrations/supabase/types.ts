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
      access_levels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          modules: string[]
          name: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          modules?: string[]
          name: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          modules?: string[]
          name?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_levels_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          old_values: Json | null
          unit_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          old_values?: Json | null
          unit_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          old_values?: Json | null
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_points: {
        Row: {
          awarded_by: string | null
          badge_id: string | null
          created_at: string
          id: string
          month: string
          points: number
          reason: string
          type: string
          unit_id: string
          user_id: string
        }
        Insert: {
          awarded_by?: string | null
          badge_id?: string | null
          created_at?: string
          id?: string
          month: string
          points?: number
          reason: string
          type?: string
          unit_id: string
          user_id: string
        }
        Update: {
          awarded_by?: string | null
          badge_id?: string | null
          created_at?: string
          id?: string
          month?: string
          points?: number
          reason?: string
          type?: string
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_points_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_closings: {
        Row: {
          cash_amount: number
          cash_difference: number | null
          created_at: string
          credit_amount: number
          date: string
          debit_amount: number
          delivery_amount: number
          expenses: Json | null
          financial_integrated: boolean
          id: string
          initial_cash: number
          meal_voucher_amount: number
          notes: string | null
          pix_amount: number
          receipt_url: string
          signed_account_amount: number
          status: Database["public"]["Enums"]["cash_closing_status"]
          total_amount: number | null
          unit_id: string | null
          unit_name: string
          updated_at: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
        }
        Insert: {
          cash_amount?: number
          cash_difference?: number | null
          created_at?: string
          credit_amount?: number
          date: string
          debit_amount?: number
          delivery_amount?: number
          expenses?: Json | null
          financial_integrated?: boolean
          id?: string
          initial_cash?: number
          meal_voucher_amount?: number
          notes?: string | null
          pix_amount?: number
          receipt_url: string
          signed_account_amount?: number
          status?: Database["public"]["Enums"]["cash_closing_status"]
          total_amount?: number | null
          unit_id?: string | null
          unit_name?: string
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Update: {
          cash_amount?: number
          cash_difference?: number | null
          created_at?: string
          credit_amount?: number
          date?: string
          debit_amount?: number
          delivery_amount?: number
          expenses?: Json | null
          financial_integrated?: boolean
          id?: string
          initial_cash?: number
          meal_voucher_amount?: number
          notes?: string | null
          pix_amount?: number
          receipt_url?: string
          signed_account_amount?: number
          status?: Database["public"]["Enums"]["cash_closing_status"]
          total_amount?: number | null
          unit_id?: string | null
          unit_name?: string
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_closings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string | null
          type: Database["public"]["Enums"]["chat_conversation_type"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string | null
          type?: Database["public"]["Enums"]["chat_conversation_type"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string | null
          type?: Database["public"]["Enums"]["chat_conversation_type"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_pinned: boolean
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_completions: {
        Row: {
          awarded_points: boolean
          checklist_type: Database["public"]["Enums"]["checklist_type"]
          completed_at: string
          completed_by: string
          contested_at: string | null
          contested_by: string | null
          contested_reason: string | null
          date: string
          finished_at: string | null
          id: string
          is_contested: boolean
          is_skipped: boolean
          item_id: string
          machine_ref: string | null
          notes: string | null
          photo_url: string | null
          points_awarded: number
          project_id: string | null
          quantity_done: number
          quantity_shipped: number
          shipped_at: string | null
          shipped_by: string | null
          started_at: string | null
          status: string
          unit_id: string | null
        }
        Insert: {
          awarded_points?: boolean
          checklist_type: Database["public"]["Enums"]["checklist_type"]
          completed_at?: string
          completed_by: string
          contested_at?: string | null
          contested_by?: string | null
          contested_reason?: string | null
          date?: string
          finished_at?: string | null
          id?: string
          is_contested?: boolean
          is_skipped?: boolean
          item_id: string
          machine_ref?: string | null
          notes?: string | null
          photo_url?: string | null
          points_awarded?: number
          project_id?: string | null
          quantity_done?: number
          quantity_shipped?: number
          shipped_at?: string | null
          shipped_by?: string | null
          started_at?: string | null
          status?: string
          unit_id?: string | null
        }
        Update: {
          awarded_points?: boolean
          checklist_type?: Database["public"]["Enums"]["checklist_type"]
          completed_at?: string
          completed_by?: string
          contested_at?: string | null
          contested_by?: string | null
          contested_reason?: string | null
          date?: string
          finished_at?: string | null
          id?: string
          is_contested?: boolean
          is_skipped?: boolean
          item_id?: string
          machine_ref?: string | null
          notes?: string | null
          photo_url?: string | null
          points_awarded?: number
          project_id?: string | null
          quantity_done?: number
          quantity_shipped?: number
          shipped_at?: string | null
          shipped_by?: string | null
          started_at?: string | null
          status?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_completions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_completions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "production_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_completions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_deadline_settings: {
        Row: {
          checklist_type: string
          deadline_hour: number
          deadline_minute: number
          id: string
          is_active: boolean
          is_next_day: boolean
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          checklist_type: string
          deadline_hour?: number
          deadline_minute?: number
          id?: string
          is_active?: boolean
          is_next_day?: boolean
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          checklist_type?: string
          deadline_hour?: number
          deadline_minute?: number
          id?: string
          is_active?: boolean
          is_next_day?: boolean
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_deadline_settings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          checklist_type: Database["public"]["Enums"]["checklist_type"]
          created_at: string
          cut_length_mm: number | null
          deleted_at: string | null
          description: string | null
          frequency: string
          id: string
          is_active: boolean
          material_code: string | null
          name: string
          piece_dimensions: string | null
          points: number
          process_type: string | null
          qty_per_rack: number | null
          requires_photo: boolean
          sort_order: number
          subcategory_id: string
          target_quantity: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          checklist_type?: Database["public"]["Enums"]["checklist_type"]
          created_at?: string
          cut_length_mm?: number | null
          deleted_at?: string | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          material_code?: string | null
          name: string
          piece_dimensions?: string | null
          points?: number
          process_type?: string | null
          qty_per_rack?: number | null
          requires_photo?: boolean
          sort_order?: number
          subcategory_id: string
          target_quantity?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          checklist_type?: Database["public"]["Enums"]["checklist_type"]
          created_at?: string
          cut_length_mm?: number | null
          deleted_at?: string | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          material_code?: string | null
          name?: string
          piece_dimensions?: string | null
          points?: number
          process_type?: string | null
          qty_per_rack?: number | null
          requires_photo?: boolean
          sort_order?: number
          subcategory_id?: string
          target_quantity?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "checklist_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_sectors: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          scope: string
          sort_order: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          scope?: string
          sort_order?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          scope?: string
          sort_order?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_sectors_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_subcategories: {
        Row: {
          created_at: string
          id: string
          name: string
          scope: string
          sector_id: string
          sort_order: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          scope?: string
          sector_id: string
          sort_order?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          scope?: string
          sector_id?: string
          sort_order?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_subcategories_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "checklist_sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_subcategories_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_conversations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          role: string
          tool_calls: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          role: string
          tool_calls?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          role?: string
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "copilot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_preferences: {
        Row: {
          category: string
          created_at: string
          id: string
          key: string
          unit_id: string | null
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          key: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          key?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_preferences_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_invoices: {
        Row: {
          account_id: string
          close_date: string
          created_at: string
          due_date: string
          id: string
          is_paid: boolean
          notes: string | null
          paid_at: string | null
          paid_from_account_id: string | null
          total_amount: number
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          close_date: string
          created_at?: string
          due_date: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          paid_at?: string | null
          paid_from_account_id?: string | null
          total_amount?: number
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          close_date?: string
          created_at?: string
          due_date?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          paid_at?: string | null
          paid_from_account_id?: string | null
          total_amount?: number
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_invoices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_invoices_paid_from_account_id_fkey"
            columns: ["paid_from_account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_invoices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_campaigns: {
        Row: {
          created_at: string
          created_by: string
          id: string
          message: string
          segment: string | null
          status: string
          total_errors: number
          total_recipients: number
          total_sent: number
          unit_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          message: string
          segment?: string | null
          status?: string
          total_errors?: number
          total_recipients?: number
          total_sent?: number
          unit_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          segment?: string | null
          status?: string
          total_errors?: number
          total_recipients?: number
          total_sent?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_campaigns_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          birthday: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          email: string | null
          id: string
          last_purchase_at: string | null
          loyalty_points: number | null
          name: string
          notes: string | null
          origin: string
          phone: string | null
          score: number | null
          segment: string | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          unit_id: string
          updated_at: string | null
          visit_frequency_days: number | null
        }
        Insert: {
          birthday?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          last_purchase_at?: string | null
          loyalty_points?: number | null
          name: string
          notes?: string | null
          origin?: string
          phone?: string | null
          score?: number | null
          segment?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          unit_id: string
          updated_at?: string | null
          visit_frequency_days?: number | null
        }
        Update: {
          birthday?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          last_purchase_at?: string | null
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          origin?: string
          phone?: string | null
          score?: number | null
          segment?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          unit_id?: string
          updated_at?: string | null
          visit_frequency_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          widgets?: Json
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          widgets?: Json
        }
        Relationships: []
      }
      employee_payments: {
        Row: {
          advance_deduction: number | null
          amount: number
          base_salary: number | null
          created_at: string
          created_by: string | null
          employee_id: string
          fgts_amount: number | null
          finance_transaction_id: string | null
          id: string
          inss_deduction: number | null
          irrf_deduction: number | null
          is_paid: boolean
          meal_allowance: number | null
          net_salary: number | null
          night_bonus: number | null
          night_hours: number | null
          notes: string | null
          other_deductions: number | null
          other_deductions_description: string | null
          other_earnings: number | null
          other_earnings_description: string | null
          overtime_bonus: number | null
          overtime_hours: number | null
          paid_at: string | null
          payment_date: string
          receipt_url: string | null
          reference_month: number
          reference_year: number
          regular_hours: number | null
          total_deductions: number | null
          total_earnings: number | null
          transport_allowance: number | null
          type: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          advance_deduction?: number | null
          amount: number
          base_salary?: number | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          fgts_amount?: number | null
          finance_transaction_id?: string | null
          id?: string
          inss_deduction?: number | null
          irrf_deduction?: number | null
          is_paid?: boolean
          meal_allowance?: number | null
          net_salary?: number | null
          night_bonus?: number | null
          night_hours?: number | null
          notes?: string | null
          other_deductions?: number | null
          other_deductions_description?: string | null
          other_earnings?: number | null
          other_earnings_description?: string | null
          overtime_bonus?: number | null
          overtime_hours?: number | null
          paid_at?: string | null
          payment_date: string
          receipt_url?: string | null
          reference_month: number
          reference_year: number
          regular_hours?: number | null
          total_deductions?: number | null
          total_earnings?: number | null
          transport_allowance?: number | null
          type: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          advance_deduction?: number | null
          amount?: number
          base_salary?: number | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          fgts_amount?: number | null
          finance_transaction_id?: string | null
          id?: string
          inss_deduction?: number | null
          irrf_deduction?: number | null
          is_paid?: boolean
          meal_allowance?: number | null
          net_salary?: number | null
          night_bonus?: number | null
          night_hours?: number | null
          notes?: string | null
          other_deductions?: number | null
          other_deductions_description?: string | null
          other_earnings?: number | null
          other_earnings_description?: string | null
          overtime_bonus?: number | null
          overtime_hours?: number | null
          paid_at?: string | null
          payment_date?: string
          receipt_url?: string | null
          reference_month?: number
          reference_year?: number
          regular_hours?: number | null
          total_deductions?: number | null
          total_earnings?: number | null
          transport_allowance?: number | null
          type?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_payments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_payments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          admission_date: string | null
          base_salary: number
          cpf: string | null
          created_at: string
          deleted_at: string | null
          department: string | null
          full_name: string
          id: string
          is_active: boolean
          notes: string | null
          pin_code: string | null
          role: string | null
          unit_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admission_date?: string | null
          base_salary?: number
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          pin_code?: string | null
          role?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admission_date?: string | null
          base_salary?: number
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          pin_code?: string | null
          role?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_accounts: {
        Row: {
          balance: number
          color: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_accounts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_budgets: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          month: number
          planned_amount: number
          unit_id: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          month: number
          planned_amount: number
          unit_id?: string | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          month?: number
          planned_amount?: number
          unit_id?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_system: boolean
          name: string
          parent_id: string | null
          sort_order: number
          type: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_system?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
          type: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_system?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
          type?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_categories_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_snapshots: {
        Row: {
          accounts_data: Json
          created_at: string
          id: string
          month: string
          name: string
          total_balance: number
          transactions_data: Json
          unit_id: string | null
          user_id: string
        }
        Insert: {
          accounts_data?: Json
          created_at?: string
          id?: string
          month: string
          name?: string
          total_balance?: number
          transactions_data?: Json
          unit_id?: string | null
          user_id: string
        }
        Update: {
          accounts_data?: Json
          created_at?: string
          id?: string
          month?: string
          name?: string
          total_balance?: number
          transactions_data?: Json
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_snapshots_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          unit_id: string | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          unit_id?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_tags_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          account_id: string | null
          amount: number
          attachment_url: string | null
          category_id: string | null
          created_at: string
          credit_card_invoice_id: string | null
          date: string
          deleted_at: string | null
          description: string
          employee_id: string | null
          id: string
          installment_group_id: string | null
          installment_number: number | null
          is_fixed: boolean
          is_paid: boolean
          is_recurring: boolean
          notes: string | null
          recurring_interval: string | null
          sort_order: number
          supplier_id: string | null
          tags: string[] | null
          to_account_id: string | null
          total_installments: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          credit_card_invoice_id?: string | null
          date?: string
          deleted_at?: string | null
          description: string
          employee_id?: string | null
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_fixed?: boolean
          is_paid?: boolean
          is_recurring?: boolean
          notes?: string | null
          recurring_interval?: string | null
          sort_order?: number
          supplier_id?: string | null
          tags?: string[] | null
          to_account_id?: string | null
          total_installments?: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          credit_card_invoice_id?: string | null
          date?: string
          deleted_at?: string | null
          description?: string
          employee_id?: string | null
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_fixed?: boolean
          is_paid?: boolean
          is_recurring?: boolean
          notes?: string | null
          recurring_interval?: string | null
          sort_order?: number
          supplier_id?: string | null
          tags?: string[] | null
          to_account_id?: string | null
          total_installments?: number | null
          type?: Database["public"]["Enums"]["transaction_type"]
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_credit_card_invoice_id_fkey"
            columns: ["credit_card_invoice_id"]
            isOneToOne: false
            referencedRelation: "credit_card_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_plays: {
        Row: {
          customer_name: string | null
          id: string
          order_id: string
          played_at: string
          prize_id: string | null
          prize_name: string
          unit_id: string
        }
        Insert: {
          customer_name?: string | null
          id?: string
          order_id: string
          played_at?: string
          prize_id?: string | null
          prize_name?: string
          unit_id: string
        }
        Update: {
          customer_name?: string | null
          id?: string
          order_id?: string
          played_at?: string
          prize_id?: string | null
          prize_name?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_plays_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "gamification_prizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_plays_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_prizes: {
        Row: {
          color: string
          created_at: string
          estimated_cost: number
          icon: string
          id: string
          is_active: boolean
          name: string
          probability: number
          sort_order: number
          type: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          estimated_cost?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          probability?: number
          sort_order?: number
          type?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          estimated_cost?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          probability?: number
          sort_order?: number
          type?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_prizes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_settings: {
        Row: {
          cooldown_minutes: number
          id: string
          is_enabled: boolean
          max_daily_cost: number
          points_per_play: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          cooldown_minutes?: number
          id?: string
          is_enabled?: boolean
          max_daily_cost?: number
          points_per_play?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          cooldown_minutes?: number
          id?: string
          is_enabled?: boolean
          max_daily_cost?: number
          points_per_play?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_settings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category_id: string | null
          created_at: string
          current_stock: number
          deleted_at: string | null
          dimensions: string | null
          id: string
          internal_code: string | null
          location: string | null
          material_type: string | null
          min_stock: number
          name: string
          production_stock: number | null
          recipe_unit_price: number | null
          recipe_unit_type: string | null
          supplier_id: string | null
          technical_spec: string | null
          thickness: string | null
          unit_id: string | null
          unit_price: number | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          warehouse_stock: number | null
          weight_per_unit: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          current_stock?: number
          deleted_at?: string | null
          dimensions?: string | null
          id?: string
          internal_code?: string | null
          location?: string | null
          material_type?: string | null
          min_stock?: number
          name: string
          production_stock?: number | null
          recipe_unit_price?: number | null
          recipe_unit_type?: string | null
          supplier_id?: string | null
          technical_spec?: string | null
          thickness?: string | null
          unit_id?: string | null
          unit_price?: number | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          warehouse_stock?: number | null
          weight_per_unit?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          current_stock?: number
          deleted_at?: string | null
          dimensions?: string | null
          id?: string
          internal_code?: string | null
          location?: string | null
          material_type?: string | null
          min_stock?: number
          name?: string
          production_stock?: number | null
          recipe_unit_price?: number | null
          recipe_unit_type?: string | null
          supplier_id?: string | null
          technical_spec?: string | null
          thickness?: string | null
          unit_id?: string | null
          unit_price?: number | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          warehouse_stock?: number | null
          weight_per_unit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: string
          token: string
          unit_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role?: string
          token?: string
          unit_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: string
          token?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_events: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          id: string
          points: number
          type: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          points?: number
          type: string
          unit_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          points?: number
          type?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          reward_value: number
          rule_type: string
          threshold: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          reward_value?: number
          rule_type: string
          threshold?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          reward_value?: number
          rule_type?: string
          threshold?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_appointments: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          scheduled_time: string
          title: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          scheduled_time: string
          title: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          scheduled_time?: string
          title?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_appointments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_tasks: {
        Row: {
          category_id: string | null
          completed_at: string | null
          created_at: string
          date: string
          due_date: string | null
          due_time: string | null
          id: string
          is_completed: boolean
          is_system_generated: boolean
          notes: string | null
          parent_id: string | null
          period: Database["public"]["Enums"]["day_period"]
          priority: Database["public"]["Enums"]["task_priority"]
          sort_order: number | null
          source_data: Json | null
          system_source: string | null
          title: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          date?: string
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_completed?: boolean
          is_system_generated?: boolean
          notes?: string | null
          parent_id?: string | null
          period?: Database["public"]["Enums"]["day_period"]
          priority?: Database["public"]["Enums"]["task_priority"]
          sort_order?: number | null
          source_data?: Json | null
          system_source?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          date?: string
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_completed?: boolean
          is_system_generated?: boolean
          notes?: string | null
          parent_id?: string | null
          period?: Database["public"]["Enums"]["day_period"]
          priority?: Database["public"]["Enums"]["task_priority"]
          sort_order?: number | null
          source_data?: Json | null
          system_source?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "manager_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_tasks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_posts: {
        Row: {
          caption: string | null
          channels: string[] | null
          created_at: string
          id: string
          media_urls: string[] | null
          notes: string | null
          published_at: string | null
          scheduled_at: string | null
          sort_order: number | null
          status: string
          tags: string[] | null
          title: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          channels?: string[] | null
          created_at?: string
          id?: string
          media_urls?: string[] | null
          notes?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          sort_order?: number | null
          status?: string
          tags?: string[] | null
          title: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          channels?: string[] | null
          created_at?: string
          id?: string
          media_urls?: string[] | null
          notes?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          sort_order?: number | null
          status?: string
          tags?: string[] | null
          title?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_posts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_groups: {
        Row: {
          availability: Json
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          schedule: Json | null
          sort_order: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          availability?: Json
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          schedule?: Json | null
          sort_order?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          availability?: Json
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          schedule?: Json | null
          sort_order?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_groups_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_groups_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_option_groups: {
        Row: {
          allow_repeat: boolean
          availability: Json
          created_at: string
          id: string
          is_active: boolean
          max_selections: number
          min_selections: number
          sort_order: number
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          allow_repeat?: boolean
          availability?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          max_selections?: number
          min_selections?: number
          sort_order?: number
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          allow_repeat?: boolean
          availability?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          max_selections?: number
          min_selections?: number
          sort_order?: number
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_option_groups_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_options: {
        Row: {
          availability: Json
          codigo_pdv: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          option_group_id: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          availability?: Json
          codigo_pdv?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          option_group_id: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          availability?: Json
          codigo_pdv?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          option_group_id?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_options_option_group_id_fkey"
            columns: ["option_group_id"]
            isOneToOne: false
            referencedRelation: "menu_option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_product_option_groups: {
        Row: {
          id: string
          option_group_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          option_group_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          option_group_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_product_option_groups_option_group_id_fkey"
            columns: ["option_group_id"]
            isOneToOne: false
            referencedRelation: "menu_option_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_product_option_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "tablet_products"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          category: string
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          description: string
          id: string
          origin: string
          read: boolean
          title: string
          type: string
          unit_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          origin?: string
          read?: boolean
          title: string
          type?: string
          unit_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          origin?: string
          read?: boolean
          title?: string
          type?: string
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          notes: string | null
          order_id: string
          quantity: number
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          order_id: string
          quantity?: number
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          supplier_id: string
          supplier_invoice_id: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id: string
          supplier_invoice_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id?: string
          supplier_invoice_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_method_settings: {
        Row: {
          create_transaction: boolean
          created_at: string
          fee_percentage: number | null
          id: string
          is_active: boolean | null
          method_key: string
          method_name: string
          settlement_day_of_week: number | null
          settlement_days: number | null
          settlement_type: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          create_transaction?: boolean
          created_at?: string
          fee_percentage?: number | null
          id?: string
          is_active?: boolean | null
          method_key: string
          method_name: string
          settlement_day_of_week?: number | null
          settlement_days?: number | null
          settlement_type?: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          create_transaction?: boolean
          created_at?: string
          fee_percentage?: number | null
          id?: string
          is_active?: boolean | null
          method_key?: string
          method_name?: string
          settlement_day_of_week?: number | null
          settlement_days?: number | null
          settlement_type?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_method_settings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      production_grouping_items: {
        Row: {
          checklist_item_id: string
          created_at: string
          grouping_id: string
          id: string
          quantity: number
          sort_order: number
        }
        Insert: {
          checklist_item_id: string
          created_at?: string
          grouping_id: string
          id?: string
          quantity?: number
          sort_order?: number
        }
        Update: {
          checklist_item_id?: string
          created_at?: string
          grouping_id?: string
          id?: string
          quantity?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_grouping_items_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_grouping_items_grouping_id_fkey"
            columns: ["grouping_id"]
            isOneToOne: false
            referencedRelation: "production_groupings"
            referencedColumns: ["id"]
          },
        ]
      }
      production_groupings: {
        Row: {
          created_at: string
          cut_time: string | null
          grouping_number: number
          id: string
          material: string | null
          movement_time: string | null
          notes: string | null
          perforation_time: string | null
          plate_size: string | null
          processing_time: string | null
          project_id: string
          thickness: string | null
          total_cut_length: string | null
          total_pieces: number
          unique_pieces: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cut_time?: string | null
          grouping_number?: number
          id?: string
          material?: string | null
          movement_time?: string | null
          notes?: string | null
          perforation_time?: string | null
          plate_size?: string | null
          processing_time?: string | null
          project_id: string
          thickness?: string | null
          total_cut_length?: string | null
          total_pieces?: number
          unique_pieces?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cut_time?: string | null
          grouping_number?: number
          id?: string
          material?: string | null
          movement_time?: string | null
          notes?: string | null
          perforation_time?: string | null
          plate_size?: string | null
          processing_time?: string | null
          project_id?: string
          thickness?: string | null
          total_cut_length?: string | null
          total_pieces?: number
          unique_pieces?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_groupings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "production_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_groupings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      production_logs: {
        Row: {
          created_at: string
          date: string
          finished_at: string | null
          finished_by: string | null
          id: string
          machine_ref: string | null
          operation: string
          operator_id: string | null
          piece_id: string
          project_id: string
          quantity_done: number
          started_at: string | null
          unit_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          finished_at?: string | null
          finished_by?: string | null
          id?: string
          machine_ref?: string | null
          operation: string
          operator_id?: string | null
          piece_id: string
          project_id: string
          quantity_done?: number
          started_at?: string | null
          unit_id: string
        }
        Update: {
          created_at?: string
          date?: string
          finished_at?: string | null
          finished_by?: string | null
          id?: string
          machine_ref?: string | null
          operation?: string
          operator_id?: string | null
          piece_id?: string
          project_id?: string
          quantity_done?: number
          started_at?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_logs_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "production_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "production_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      production_operations: {
        Row: {
          completion_id: string
          created_at: string
          finished_at: string | null
          id: string
          machine_ref: string | null
          notes: string | null
          operator_id: string | null
          process_type: string
          quantity_done: number
          started_at: string | null
          step_order: number
          unit_id: string | null
        }
        Insert: {
          completion_id: string
          created_at?: string
          finished_at?: string | null
          id?: string
          machine_ref?: string | null
          notes?: string | null
          operator_id?: string | null
          process_type: string
          quantity_done?: number
          started_at?: string | null
          step_order?: number
          unit_id?: string | null
        }
        Update: {
          completion_id?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          machine_ref?: string | null
          notes?: string | null
          operator_id?: string | null
          process_type?: string
          quantity_done?: number
          started_at?: string | null
          step_order?: number
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_operations_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "checklist_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_operations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_items: {
        Row: {
          checklist_item_id: string
          created_at: string
          id: string
          order_id: string | null
          project_id: string | null
          quantity_ordered: number
          unit_id: string
        }
        Insert: {
          checklist_item_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          project_id?: string | null
          quantity_ordered?: number
          unit_id: string
        }
        Update: {
          checklist_item_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          project_id?: string | null
          quantity_ordered?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_order_items_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "production_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          created_at: string
          created_by: string
          date: string
          destination: string | null
          id: string
          notes: string | null
          order_number: number | null
          project_id: string | null
          requester: string | null
          shift: number
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          destination?: string | null
          id?: string
          notes?: string | null
          order_number?: number | null
          project_id?: string | null
          requester?: string | null
          shift?: number
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          destination?: string | null
          id?: string
          notes?: string | null
          order_number?: number | null
          project_id?: string | null
          requester?: string | null
          shift?: number
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "production_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      production_pieces: {
        Row: {
          created_at: string
          cut_length_mm: number | null
          description: string
          id: string
          material_code: string | null
          process_type: string | null
          project_id: string
          qty_per_rack: number | null
          qty_total: number
          sort_order: number | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cut_length_mm?: number | null
          description: string
          id?: string
          material_code?: string | null
          process_type?: string | null
          project_id: string
          qty_per_rack?: number | null
          qty_total?: number
          sort_order?: number | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cut_length_mm?: number | null
          description?: string
          id?: string
          material_code?: string | null
          process_type?: string | null
          project_id?: string
          qty_per_rack?: number | null
          qty_total?: number
          sort_order?: number | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_pieces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "production_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_pieces_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      production_projects: {
        Row: {
          client: string | null
          created_at: string
          description: string
          id: string
          material: string | null
          plate_size: string | null
          project_number: string
          status: string
          thickness: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          client?: string | null
          created_at?: string
          description: string
          id?: string
          material?: string | null
          plate_size?: string | null
          project_number: string
          status?: string
          thickness?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          client?: string | null
          created_at?: string
          description?: string
          id?: string
          material?: string | null
          plate_size?: string | null
          project_number?: string
          status?: string
          thickness?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_projects_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      production_shipments: {
        Row: {
          created_at: string
          destination: string | null
          id: string
          operator_id: string | null
          piece_id: string
          project_id: string
          quantity: number
          requester: string | null
          shipped_at: string | null
          unit_id: string
        }
        Insert: {
          created_at?: string
          destination?: string | null
          id?: string
          operator_id?: string | null
          piece_id: string
          project_id: string
          quantity?: number
          requester?: string | null
          shipped_at?: string | null
          unit_id: string
        }
        Update: {
          created_at?: string
          destination?: string | null
          id?: string
          operator_id?: string | null
          piece_id?: string
          project_id?: string
          quantity?: number
          requester?: string | null
          shipped_at?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_shipments_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "production_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_shipments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "production_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_shipments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string
          id: string
          job_title: string | null
          plan: string
          plan_status: string
          selected_frame: string | null
          status: Database["public"]["Enums"]["user_status"]
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name: string
          id?: string
          job_title?: string | null
          plan?: string
          plan_status?: string
          selected_frame?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          plan?: string
          plan_status?: string
          selected_frame?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_config: {
        Row: {
          created_at: string
          id: string
          vapid_private_key: string
          vapid_public_key: string
          vapid_subject: string
        }
        Insert: {
          created_at?: string
          id?: string
          vapid_private_key: string
          vapid_public_key: string
          vapid_subject?: string
        }
        Update: {
          created_at?: string
          id?: string
          vapid_private_key?: string
          vapid_public_key?: string
          vapid_subject?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          quantity: number
          quotation_id: string
          winner_supplier_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          quantity?: number
          quotation_id: string
          winner_supplier_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          quantity?: number
          quotation_id?: string
          winner_supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_winner_supplier_id_fkey"
            columns: ["winner_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_prices: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          notes: string | null
          quotation_item_id: string
          quotation_supplier_id: string
          round: number
          unit_price: number
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          quotation_item_id: string
          quotation_supplier_id: string
          round?: number
          unit_price?: number
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          quotation_item_id?: string
          quotation_supplier_id?: string
          round?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_prices_quotation_item_id_fkey"
            columns: ["quotation_item_id"]
            isOneToOne: false
            referencedRelation: "quotation_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_prices_quotation_supplier_id_fkey"
            columns: ["quotation_supplier_id"]
            isOneToOne: false
            referencedRelation: "quotation_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_suppliers: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          quotation_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["quotation_supplier_status"]
          supplier_id: string
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          quotation_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["quotation_supplier_status"]
          supplier_id: string
          token?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          quotation_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["quotation_supplier_status"]
          supplier_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_suppliers_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          created_at: string
          deadline: string | null
          id: string
          notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          title: string
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          title?: string
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          title?: string
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          company: string | null
          created_at: string
          description: string
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          description: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          description?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipe_categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      recipe_cost_settings: {
        Row: {
          card_fee_percentage: number
          created_at: string
          fixed_cost_category_ids: string[] | null
          id: string
          monthly_products_sold: number
          packaging_cost_per_unit: number
          tax_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_fee_percentage?: number
          created_at?: string
          fixed_cost_category_ids?: string[] | null
          id?: string
          monthly_products_sold?: number
          packaging_cost_per_unit?: number
          tax_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_fee_percentage?: number
          created_at?: string
          fixed_cost_category_ids?: string[] | null
          id?: string
          monthly_products_sold?: number
          packaging_cost_per_unit?: number
          tax_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          quantity: number
          recipe_id: string
          sort_order: number | null
          source_recipe_id: string | null
          source_type: string
          total_cost: number
          unit_cost: number
          unit_type: Database["public"]["Enums"]["recipe_unit_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          quantity: number
          recipe_id: string
          sort_order?: number | null
          source_recipe_id?: string | null
          source_type?: string
          total_cost?: number
          unit_cost?: number
          unit_type: Database["public"]["Enums"]["recipe_unit_type"]
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          quantity?: number
          recipe_id?: string
          sort_order?: number | null
          source_recipe_id?: string | null
          source_type?: string
          total_cost?: number
          unit_cost?: number
          unit_type?: Database["public"]["Enums"]["recipe_unit_type"]
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_source_recipe_id_fkey"
            columns: ["source_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category_id: string | null
          cost_per_portion: number
          cost_updated_at: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          preparation_notes: string | null
          total_cost: number
          updated_at: string
          yield_quantity: number
          yield_unit: string
        }
        Insert: {
          category_id?: string | null
          cost_per_portion?: number
          cost_updated_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          preparation_notes?: string | null
          total_cost?: number
          updated_at?: string
          yield_quantity?: number
          yield_unit?: string
        }
        Update: {
          category_id?: string | null
          cost_per_portion?: number
          cost_updated_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          preparation_notes?: string | null
          total_cost?: number
          updated_at?: string
          yield_quantity?: number
          yield_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "recipe_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          points_cost: number
          stock: number | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          points_cost: number
          stock?: number | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          points_cost?: number
          stock?: number | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          points_spent: number
          product_id: string
          status: Database["public"]["Enums"]["reward_status"]
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          points_spent: number
          product_id: string
          status?: Database["public"]["Enums"]["reward_status"]
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          points_spent?: number
          product_id?: string
          status?: Database["public"]["Enums"]["reward_status"]
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "reward_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_modules: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          modules: string[]
          sector_name: string
          sort_order: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          modules?: string[]
          sector_name: string
          sort_order?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          modules?: string[]
          sector_name?: string
          sort_order?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sector_modules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_receiving_items: {
        Row: {
          confidence: number | null
          confirmed_quantity: number | null
          confirmed_unit_price: number | null
          created_at: string
          id: string
          inventory_item_id: string | null
          is_confirmed: boolean | null
          is_new_item: boolean | null
          matched_name: string | null
          raw_description: string
          raw_quantity: number
          raw_total: number | null
          raw_unit_price: number | null
          raw_unit_type: string | null
          receiving_id: string
        }
        Insert: {
          confidence?: number | null
          confirmed_quantity?: number | null
          confirmed_unit_price?: number | null
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          is_confirmed?: boolean | null
          is_new_item?: boolean | null
          matched_name?: string | null
          raw_description: string
          raw_quantity?: number
          raw_total?: number | null
          raw_unit_price?: number | null
          raw_unit_type?: string | null
          receiving_id: string
        }
        Update: {
          confidence?: number | null
          confirmed_quantity?: number | null
          confirmed_unit_price?: number | null
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          is_confirmed?: boolean | null
          is_new_item?: boolean | null
          matched_name?: string | null
          raw_description?: string
          raw_quantity?: number
          raw_total?: number | null
          raw_unit_price?: number | null
          raw_unit_type?: string | null
          receiving_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_receiving_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_receiving_items_receiving_id_fkey"
            columns: ["receiving_id"]
            isOneToOne: false
            referencedRelation: "smart_receivings"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_receivings: {
        Row: {
          ai_raw_response: Json | null
          boleto_amount: number | null
          boleto_barcode: string | null
          boleto_due_date: string | null
          boleto_image_url: string | null
          confirmed_at: string | null
          created_at: string
          finance_transaction_id: string | null
          id: string
          invoice_date: string | null
          invoice_image_url: string | null
          invoice_number: string | null
          order_id: string | null
          status: string
          supplier_id: string | null
          supplier_invoice_id: string | null
          supplier_name: string | null
          total_amount: number | null
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_raw_response?: Json | null
          boleto_amount?: number | null
          boleto_barcode?: string | null
          boleto_due_date?: string | null
          boleto_image_url?: string | null
          confirmed_at?: string | null
          created_at?: string
          finance_transaction_id?: string | null
          id?: string
          invoice_date?: string | null
          invoice_image_url?: string | null
          invoice_number?: string | null
          order_id?: string | null
          status?: string
          supplier_id?: string | null
          supplier_invoice_id?: string | null
          supplier_name?: string | null
          total_amount?: number | null
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_raw_response?: Json | null
          boleto_amount?: number | null
          boleto_barcode?: string | null
          boleto_due_date?: string | null
          boleto_image_url?: string | null
          confirmed_at?: string | null
          created_at?: string
          finance_transaction_id?: string | null
          id?: string
          invoice_date?: string | null
          invoice_image_url?: string | null
          invoice_number?: string | null
          order_id?: string | null
          status?: string
          supplier_id?: string | null
          supplier_invoice_id?: string | null
          supplier_name?: string | null
          total_amount?: number | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_receivings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_receivings_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_receivings_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_receivings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          item_id: string
          location: string | null
          notes: string | null
          quantity: number
          type: Database["public"]["Enums"]["movement_type"]
          unit_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          location?: string | null
          notes?: string | null
          quantity: number
          type: Database["public"]["Enums"]["movement_type"]
          unit_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          location?: string | null
          notes?: string | null
          quantity?: number
          type?: Database["public"]["Enums"]["movement_type"]
          unit_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoices: {
        Row: {
          amount: number
          created_at: string
          description: string
          due_date: string
          finance_transaction_id: string | null
          id: string
          invoice_number: string | null
          is_paid: boolean
          issue_date: string
          notes: string | null
          paid_at: string | null
          supplier_id: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          due_date: string
          finance_transaction_id?: string | null
          id?: string
          invoice_number?: string | null
          is_paid?: boolean
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          supplier_id: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string
          finance_transaction_id?: string | null
          id?: string
          invoice_number?: string | null
          is_paid?: boolean
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          supplier_id?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_finance_transaction_id_fkey"
            columns: ["finance_transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_price_history: {
        Row: {
          id: string
          item_id: string
          recorded_at: string
          supplier_id: string | null
          unit_id: string | null
          unit_price: number
        }
        Insert: {
          id?: string
          item_id: string
          recorded_at?: string
          supplier_id?: string | null
          unit_id?: string | null
          unit_price?: number
        }
        Update: {
          id?: string
          item_id?: string
          recorded_at?: string
          supplier_id?: string | null
          unit_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_price_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_price_history_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_price_history_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string
          delivery_frequency: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_frequency?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_frequency?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tablet_order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "tablet_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "tablet_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tablet_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "tablet_products"
            referencedColumns: ["id"]
          },
        ]
      }
      tablet_orders: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          pdv_response: Json | null
          retry_count: number | null
          status: string
          table_number: number
          total: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          pdv_response?: Json | null
          retry_count?: number | null
          status?: string
          table_number: number
          total?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          pdv_response?: Json | null
          retry_count?: number | null
          status?: string
          table_number?: number
          total?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tablet_orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tablet_pdv_config: {
        Row: {
          auth_key: string
          created_at: string
          hub_url: string
          id: string
          is_active: boolean
          payment_code: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          hub_url: string
          id?: string
          is_active?: boolean
          payment_code?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          hub_url?: string
          id?: string
          is_active?: boolean
          payment_code?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tablet_pdv_config_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tablet_products: {
        Row: {
          availability: Json
          category: string
          codigo_pdv: string | null
          created_at: string
          custom_prices: Json | null
          description: string | null
          group_id: string | null
          id: string
          image_url: string | null
          is_18_plus: boolean
          is_active: boolean
          is_highlighted: boolean
          name: string
          price: number
          price_type: string
          schedule: Json | null
          sort_order: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          availability?: Json
          category?: string
          codigo_pdv?: string | null
          created_at?: string
          custom_prices?: Json | null
          description?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_18_plus?: boolean
          is_active?: boolean
          is_highlighted?: boolean
          name: string
          price?: number
          price_type?: string
          schedule?: Json | null
          sort_order?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          availability?: Json
          category?: string
          codigo_pdv?: string | null
          created_at?: string
          custom_prices?: Json | null
          description?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_18_plus?: boolean
          is_active?: boolean
          is_highlighted?: boolean
          name?: string
          price?: number
          price_type?: string
          schedule?: Json | null
          sort_order?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tablet_products_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "menu_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tablet_products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tablet_qr_confirmations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          order_id: string
          token: string
          used: boolean
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          order_id: string
          token: string
          used?: boolean
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          order_id?: string
          token?: string
          used?: boolean
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tablet_qr_confirmations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "tablet_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      tablet_tables: {
        Row: {
          created_at: string
          id: string
          number: number
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          number: number
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          number?: number
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tablet_tables_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_alert_settings: {
        Row: {
          created_at: string
          critical_hour: number | null
          enabled: boolean
          id: string
          module_key: string
          unit_id: string | null
          updated_at: string
          user_id: string
          warning_hour: number | null
        }
        Insert: {
          created_at?: string
          critical_hour?: number | null
          enabled?: boolean
          id?: string
          module_key: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
          warning_hour?: number | null
        }
        Update: {
          created_at?: string
          critical_hour?: number | null
          enabled?: boolean
          id?: string
          module_key?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
          warning_hour?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "time_alert_settings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      time_records: {
        Row: {
          adjusted_by: string | null
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          early_departure_minutes: number
          expected_end: string
          expected_start: string
          id: string
          late_minutes: number
          manual_entry: boolean
          notes: string | null
          points_awarded: number
          points_processed: boolean
          status: string
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adjusted_by?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          early_departure_minutes?: number
          expected_end?: string
          expected_start?: string
          id?: string
          late_minutes?: number
          manual_entry?: boolean
          notes?: string | null
          points_awarded?: number
          points_processed?: boolean
          status?: string
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adjusted_by?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          early_departure_minutes?: number
          expected_end?: string
          expected_start?: string
          id?: string
          late_minutes?: number
          manual_entry?: boolean
          notes?: string | null
          points_awarded?: number
          points_processed?: boolean
          status?: string
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_records_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      time_tracking_settings: {
        Row: {
          created_at: string
          grace_period_minutes: number
          id: string
          max_penalty_per_day: number
          points_on_time_bonus: number
          points_per_minute_early: number
          points_per_minute_late: number
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grace_period_minutes?: number
          id?: string
          max_penalty_per_day?: number
          points_on_time_bonus?: number
          points_per_minute_early?: number
          points_per_minute_late?: number
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          grace_period_minutes?: number
          id?: string
          max_penalty_per_day?: number
          points_on_time_bonus?: number
          points_per_minute_early?: number
          points_per_minute_late?: number
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_settings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          slug: string
          store_info: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          store_info?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          store_info?: Json | null
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_units: {
        Row: {
          access_level_id: string | null
          created_at: string
          id: string
          is_default: boolean
          role: string
          sector_module_id: string | null
          unit_id: string
          user_id: string
        }
        Insert: {
          access_level_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          role?: string
          sector_module_id?: string | null
          unit_id: string
          user_id: string
        }
        Update: {
          access_level_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          role?: string
          sector_module_id?: string | null
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_units_access_level_id_fkey"
            columns: ["access_level_id"]
            isOneToOne: false
            referencedRelation: "access_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_units_sector_module_id_fkey"
            columns: ["sector_module_id"]
            isOneToOne: false
            referencedRelation: "sector_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_ai_logs: {
        Row: {
          action: string
          context_used: Json | null
          conversation_id: string | null
          created_at: string
          id: string
          message_id: string | null
          reasoning: string | null
        }
        Insert: {
          action: string
          context_used?: Json | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          reasoning?: string | null
        }
        Update: {
          action?: string
          context_used?: Json | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          reasoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_ai_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_ai_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_channels: {
        Row: {
          ai_personality: string | null
          api_key_ref: string | null
          api_url: string | null
          business_hours: Json | null
          created_at: string
          fallback_message: string | null
          id: string
          instance_name: string | null
          is_active: boolean
          phone_number: string
          provider: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          ai_personality?: string | null
          api_key_ref?: string | null
          api_url?: string | null
          business_hours?: Json | null
          created_at?: string
          fallback_message?: string | null
          id?: string
          instance_name?: string | null
          is_active?: boolean
          phone_number: string
          provider?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          ai_personality?: string | null
          api_key_ref?: string | null
          api_url?: string | null
          business_hours?: Json | null
          created_at?: string
          fallback_message?: string | null
          id?: string
          instance_name?: string | null
          is_active?: boolean
          phone_number?: string
          provider?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_channels_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          created_at: string
          id: string
          last_interaction_at: string | null
          name: string | null
          notes: string | null
          phone: string
          total_orders: number
          unit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_interaction_at?: string | null
          name?: string | null
          notes?: string | null
          phone: string
          total_orders?: number
          unit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_interaction_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string
          total_orders?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          ai_context: Json | null
          assigned_to: string | null
          channel_id: string
          closed_at: string | null
          contact_id: string
          created_at: string
          id: string
          started_at: string
          status: string
          unit_id: string
        }
        Insert: {
          ai_context?: Json | null
          assigned_to?: string | null
          channel_id: string
          closed_at?: string | null
          contact_id: string
          created_at?: string
          id?: string
          started_at?: string
          status?: string
          unit_id: string
        }
        Update: {
          ai_context?: Json | null
          assigned_to?: string | null
          channel_id?: string
          closed_at?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          started_at?: string
          status?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_knowledge_base_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          metadata: Json | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          metadata?: Json | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          metadata?: Json | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_orders: {
        Row: {
          contact_id: string
          conversation_id: string | null
          created_at: string
          id: string
          items: Json
          notes: string | null
          status: string
          total: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          total?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          total?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_orders_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          approved_by: string | null
          created_at: string
          day_off: number
          id: string
          month: number
          notes: string | null
          status: Database["public"]["Enums"]["schedule_status"]
          unit_id: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          day_off: number
          id?: string
          month: number
          notes?: string | null
          status?: Database["public"]["Enums"]["schedule_status"]
          unit_id?: string | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          day_off?: number
          id?: string
          month?: number
          notes?: string | null
          status?: Database["public"]["Enums"]["schedule_status"]
          unit_id?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_user: {
        Args: {
          p_role?: Database["public"]["Enums"]["app_role"]
          p_sector_module_id?: string
          p_target_user_id: string
          p_unit_id?: string
        }
        Returns: undefined
      }
      auto_provision_unit: { Args: { p_user_id: string }; Returns: string }
      batch_reorder_checklist_items: {
        Args: { p_ids: string[]; p_orders: number[] }
        Returns: undefined
      }
      batch_reorder_checklist_sectors: {
        Args: { p_ids: string[]; p_orders: number[] }
        Returns: undefined
      }
      batch_reorder_checklist_subcategories: {
        Args: { p_ids: string[]; p_orders: number[] }
        Returns: undefined
      }
      batch_reorder_transactions: {
        Args: { p_ids: string[]; p_orders: number[] }
        Returns: undefined
      }
      delete_unit_cascade: { Args: { p_unit_id: string }; Returns: undefined }
      get_chat_conversation_type: {
        Args: { _conversation_id: string }
        Returns: Database["public"]["Enums"]["chat_conversation_type"]
      }
      get_dashboard_stats: {
        Args: { p_is_admin?: boolean; p_unit_id: string; p_user_id: string }
        Returns: Json
      }
      get_global_leaderboard_data: {
        Args: { p_month_end: string; p_month_start: string }
        Returns: {
          bonus_points: number
          earned_all_time: number
          earned_points: number
          spent_points: number
          unit_id: string
          user_id: string
        }[]
      }
      get_invite_by_token: {
        Args: { p_token: string }
        Returns: {
          accepted_at: string
          email: string
          expires_at: string
          id: string
          role: string
          token: string
          unit_id: string
          unit_name: string
        }[]
      }
      get_leaderboard_data: {
        Args: { p_month_end: string; p_month_start: string; p_unit_id: string }
        Returns: {
          bonus_points: number
          earned_all_time: number
          earned_points: number
          spent_points: number
          user_id: string
        }[]
      }
      get_sector_points_summary: { Args: { p_unit_id: string }; Returns: Json }
      get_unit_plan: { Args: { p_unit_id: string }; Returns: string }
      get_user_unit_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
      is_chat_admin: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id: string
          p_entity_type: string
          p_old_values?: Json
          p_unit_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      recalculate_all_customer_scores: {
        Args: { p_unit_id: string }
        Returns: undefined
      }
      recalculate_customer_score: {
        Args: { p_customer_id: string }
        Returns: undefined
      }
      suspend_user: { Args: { p_target_user_id: string }; Returns: undefined }
      user_has_unit_access: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "funcionario" | "super_admin" | "lider"
      cash_closing_status: "pending" | "approved" | "divergent"
      chat_conversation_type: "direct" | "group" | "announcement"
      checklist_type: "abertura" | "fechamento" | "limpeza" | "bonus"
      day_period: "morning" | "afternoon" | "evening"
      movement_type: "entrada" | "saida"
      order_status: "draft" | "sent" | "received" | "cancelled"
      quotation_status:
        | "draft"
        | "sent"
        | "comparing"
        | "contested"
        | "resolved"
      quotation_supplier_status: "pending" | "responded" | "contested"
      recipe_unit_type: "unidade" | "kg" | "g" | "litro" | "ml"
      reward_status: "pending" | "approved" | "delivered" | "cancelled"
      schedule_status: "pending" | "approved" | "rejected"
      task_priority: "low" | "medium" | "high"
      transaction_type: "income" | "expense" | "transfer" | "credit_card"
      unit_type: "unidade" | "kg" | "litro" | "metro" | "metro_quadrado"
      user_status: "pending" | "approved" | "suspended"
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
      app_role: ["admin", "funcionario", "super_admin", "lider"],
      cash_closing_status: ["pending", "approved", "divergent"],
      chat_conversation_type: ["direct", "group", "announcement"],
      checklist_type: ["abertura", "fechamento", "limpeza", "bonus"],
      day_period: ["morning", "afternoon", "evening"],
      movement_type: ["entrada", "saida"],
      order_status: ["draft", "sent", "received", "cancelled"],
      quotation_status: ["draft", "sent", "comparing", "contested", "resolved"],
      quotation_supplier_status: ["pending", "responded", "contested"],
      recipe_unit_type: ["unidade", "kg", "g", "litro", "ml"],
      reward_status: ["pending", "approved", "delivered", "cancelled"],
      schedule_status: ["pending", "approved", "rejected"],
      task_priority: ["low", "medium", "high"],
      transaction_type: ["income", "expense", "transfer", "credit_card"],
      unit_type: ["unidade", "kg", "litro", "metro", "metro_quadrado"],
      user_status: ["pending", "approved", "suspended"],
    },
  },
} as const
