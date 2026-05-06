import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          subdomain: string
          name: string
          owner_id: string
          plan: string
          status: string
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subdomain: string
          name: string
          owner_id: string
          plan?: string
          status?: string
          trial_ends_at?: string | null
        }
        Update: {
          id?: string
          subdomain?: string
          name?: string
          owner_id?: string
          plan?: string
          status?: string
          trial_ends_at?: string | null
        }
      }
      tenant_settings: {
        Row: {
          id: string
          tenant_id: string
          business_phone: string | null
          business_address: string | null
          logo_url: string | null
          banner_url: string | null
          primary_color: string
          secondary_color: string
          accent_color: string
          business_hours: any
          delivery_fee: number
          minimum_order: number
          is_open: boolean
          hero_title: string
          hero_subtitle: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          business_phone?: string | null
          business_address?: string | null
          logo_url?: string | null
          banner_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          business_hours?: any
          delivery_fee?: number
          minimum_order?: number
          is_open?: boolean
          hero_title?: string
          hero_subtitle?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          business_phone?: string | null
          business_address?: string | null
          logo_url?: string | null
          banner_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          business_hours?: any
          delivery_fee?: number
          minimum_order?: number
          is_open?: boolean
          hero_title?: string
          hero_subtitle?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          tenant_id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          display_order?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          display_order?: number
          is_active?: boolean
        }
      }
      products: {
        Row: {
          id: string
          tenant_id: string
          category_id: string
          name: string
          slug: string
          description: string | null
          price: number
          pricing_type: 'unidade' | 'cento' | 'kg'
          min_quantity: number | null
          step_quantity: number
          image_url: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          category_id: string
          name: string
          slug: string
          description?: string | null
          price: number
          pricing_type: 'unidade' | 'cento' | 'kg'
          min_quantity?: number | null
          step_quantity?: number
          image_url?: string | null
          is_active?: boolean
          display_order?: number
        }
        Update: {
          id?: string
          tenant_id?: string
          category_id?: string
          name?: string
          slug?: string
          description?: string | null
          price?: number
          pricing_type?: 'unidade' | 'cento' | 'kg'
          min_quantity?: number | null
          step_quantity?: number
          image_url?: string | null
          is_active?: boolean
          display_order?: number
        }
      }
      promotions: {
        Row: {
          id: string
          tenant_id: string
          product_id: string
          name: string
          label: string
          promotional_price: number
          discount_percentage: number
          valid_from: string
          valid_until: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          product_id: string
          name: string
          label?: string
          promotional_price: number
          discount_percentage: number
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          tenant_id?: string
          product_id?: string
          name?: string
          label?: string
          promotional_price?: number
          discount_percentage?: number
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean
        }
      }
    }
    Functions: {
      check_subdomain_availability: {
        Args: { subdomain_param: string }
        Returns: boolean
      }
      get_tenant_by_subdomain: {
        Args: { subdomain_param: string }
        Returns: {
          tenant_id: string
          tenant_name: string
          tenant_status: string
          business_phone: string | null
          business_address: string | null
          logo_url: string | null
          banner_url: string | null
          primary_color: string
          secondary_color: string
          accent_color: string
          business_hours: any
          delivery_fee: number
          minimum_order: number
          is_open: boolean
          hero_title: string
          hero_subtitle: string | null
        }[]
      }
      get_menu_by_subdomain: {
        Args: { subdomain_param: string }
        Returns: any
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]