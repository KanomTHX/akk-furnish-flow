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
      products: {
        Row: {
          brand: string | null
          category: string
          code: string
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          min_stock_level: number | null
          model: string | null
          name: string
          price: number
          stock_quantity: number | null
          updated_at: string | null
          warranty_months: number | null
        }
        Insert: {
          brand?: string | null
          category: string
          code: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          min_stock_level?: number | null
          model?: string | null
          name: string
          price: number
          stock_quantity?: number | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Update: {
          brand?: string | null
          category?: string
          code?: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          min_stock_level?: number | null
          model?: string | null
          name?: string
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Relationships: []
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
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
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
