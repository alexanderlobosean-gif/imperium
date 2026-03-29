import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Singleton pattern para evitar múltiplas instâncias
let supabaseInstance = null
let supabaseAdminInstance = null

export const supabase = supabaseInstance || (supabaseInstance = createClient(supabaseUrl, supabaseAnonKey))

// Helper function to get service role client (for admin operations)
export const supabaseAdmin = supabaseAdminInstance || (supabaseAdminInstance = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
))
