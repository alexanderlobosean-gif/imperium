import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Singleton pattern - evita múltiplas instâncias do GoTrueClient
let supabaseInstance = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: localStorage,
        storageKey: 'sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token',
        // Desativar debug para reduzir logs
        debug: false
      },
      // Configurações para evitar múltiplas requisições
      global: {
        headers: {
          'x-client-info': 'supabase-js/2.0'
        }
      }
    })
  }
  return supabaseInstance
}

// Exporta singleton
export const supabase = getSupabaseClient()
