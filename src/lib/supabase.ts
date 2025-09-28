import { createClient } from '@supabase/supabase-js'

// Ensure environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Create Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side client for use in Server Components and Server Actions
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })
}

// Database types for electrical device management
export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          tenant_id: string
          room_number: string
          room_type: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          room_number: string
          room_type?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          room_number?: string
          room_type?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      electrical_devices: {
        Row: {
          id: string
          tenant_id: string
          room_id: string | null
          device_name: string
          power_watts: number
          usage_hours_per_day: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          room_id?: string | null
          device_name: string
          power_watts: number
          usage_hours_per_day: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          room_id?: string | null
          device_name?: string
          power_watts?: number
          usage_hours_per_day?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Type aliases for convenience
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type NewTenant = Database['public']['Tables']['tenants']['Insert']
export type Room = Database['public']['Tables']['rooms']['Row']
export type NewRoom = Database['public']['Tables']['rooms']['Insert']
export type ElectricalDevice = Database['public']['Tables']['electrical_devices']['Row']
export type NewElectricalDevice = Database['public']['Tables']['electrical_devices']['Insert']