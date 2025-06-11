export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      branches: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          manager_id: string | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sale_items: {
        Row: {
          cash_sale_id: string | null
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          cash_sale_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          cash_sale_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_sale_items_cash_sale_id_fkey"
            columns: ["cash_sale_id"]
            isOneToOne: false
            referencedRelation: "cash_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sales: {
        Row: {
          cashier_id: string | null
          created_at: string | null
          customer_id: string | null
          discount: number | null
          id: string
          payment_method: string
          payment_status: string
          receipt_number: string | null
          sale_date: string | null
          sale_number: string
          sales_person_id: string | null
          subtotal: number
          tax: number | null
          total_amount: number
        }
        Insert: {
          cashier_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          discount?: number | null
          id?: string
          payment_method: string
          payment_status?: string
          receipt_number?: string | null
          sale_date?: string | null
          sale_number: string
          sales_person_id?: string | null
          subtotal: number
          tax?: number | null
          total_amount: number
        }
        Update: {
          cashier_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          discount?: number | null
          id?: string
          payment_method?: string
          payment_status?: string
          receipt_number?: string | null
          sale_date?: string | null
          sale_number?: string
          sales_person_id?: string | null
          subtotal?: number
          tax?: number | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_sales_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sales_sales_person_id_fkey"
            columns: ["sales_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          customer_type: string
          email: string | null
          id: string
          last_purchase_date: string | null
          name: string
          phone: string
          total_purchases: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          customer_type?: string
          email?: string | null
          id?: string
          last_purchase_date?: string | null
          name: string
          phone: string
          total_purchases?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          customer_type?: string
          email?: string | null
          id?: string
          last_purchase_date?: string | null
          name?: string
          phone?: string
          total_purchases?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category_id: string
          created_at: string | null
          created_by: string | null
          description: string
          expense_date: string
          id: string
          receipt_number: string | null
          status: string
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          expense_date?: string
          id?: string
          receipt_number?: string | null
          status?: string
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          receipt_number?: string | null
          status?: string
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hire_purchase_contracts: {
        Row: {
          contract_date: string
          contract_number: string
          created_at: string | null
          credit_officer_id: string | null
          customer_id: string | null
          down_payment: number
          first_payment_date: string
          id: string
          installment_months: number
          interest_rate: number
          monthly_payment: number
          remaining_amount: number
          sales_person_id: string | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          contract_date: string
          contract_number: string
          created_at?: string | null
          credit_officer_id?: string | null
          customer_id?: string | null
          down_payment: number
          first_payment_date: string
          id?: string
          installment_months: number
          interest_rate: number
          monthly_payment: number
          remaining_amount: number
          sales_person_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          contract_date?: string
          contract_number?: string
          created_at?: string | null
          credit_officer_id?: string | null
          customer_id?: string | null
          down_payment?: number
          first_payment_date?: string
          id?: string
          installment_months?: number
          interest_rate?: number
          monthly_payment?: number
          remaining_amount?: number
          sales_person_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hire_purchase_contracts_credit_officer_id_fkey"
            columns: ["credit_officer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_purchase_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_purchase_contracts_sales_person_id_fkey"
            columns: ["sales_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hire_purchase_items: {
        Row: {
          contract_id: string | null
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "hire_purchase_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "hire_purchase_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_payments: {
        Row: {
          amount_due: number
          amount_paid: number | null
          cashier_id: string | null
          contract_id: string | null
          created_at: string | null
          due_date: string
          id: string
          installment_number: number
          late_fee: number | null
          payment_date: string | null
          payment_method: string | null
          receipt_number: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          cashier_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          installment_number: number
          late_fee?: number | null
          payment_date?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          cashier_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          late_fee?: number | null
          payment_date?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_payments_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "hire_purchase_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          from_location: string | null
          id: string
          movement_type: string
          notes: string | null
          product_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          to_location: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          from_location?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          to_location?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          from_location?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          to_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_history: {
        Row: {
          action_date: string | null
          action_type: string
          created_at: string | null
          from_branch_id: string | null
          id: string
          notes: string | null
          performed_by: string | null
          product_id: string
          reference_id: string | null
          serial_number: string
          to_branch_id: string | null
        }
        Insert: {
          action_date?: string | null
          action_type: string
          created_at?: string | null
          from_branch_id?: string | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          product_id: string
          reference_id?: string | null
          serial_number: string
          to_branch_id?: string | null
        }
        Update: {
          action_date?: string | null
          action_type?: string
          created_at?: string | null
          from_branch_id?: string | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          product_id?: string
          reference_id?: string | null
          serial_number?: string
          to_branch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_history_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_history_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      product_transfers: {
        Row: {
          created_at: string | null
          from_branch_id: string | null
          id: string
          notes: string | null
          product_id: string
          received_by: string | null
          status: string
          to_branch_id: string
          transfer_date: string | null
          transferred_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_branch_id?: string | null
          id?: string
          notes?: string | null
          product_id: string
          received_by?: string | null
          status?: string
          to_branch_id: string
          transfer_date?: string | null
          transferred_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_branch_id?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          received_by?: string | null
          status?: string
          to_branch_id?: string
          transfer_date?: string | null
          transferred_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_transfers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_transfers_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_transfers_transferred_by_fkey"
            columns: ["transferred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          branch_id: string | null
          brand: string | null
          category: string
          code: string
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          min_stock_level: number | null
          model: string | null
          name: string
          price: number
          serial_number: string
          stock_quantity: number | null
          updated_at: string | null
          warranty_months: number | null
        }
        Insert: {
          branch_id?: string | null
          brand?: string | null
          category: string
          code: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          min_stock_level?: number | null
          model?: string | null
          name: string
          price: number
          serial_number?: string
          stock_quantity?: number | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Update: {
          branch_id?: string | null
          brand?: string | null
          category?: string
          code?: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          min_stock_level?: number | null
          model?: string | null
          name?: string
          price?: number
          serial_number?: string
          stock_quantity?: number | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          role: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
