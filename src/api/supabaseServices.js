// API services for Supabase operations
import { supabase, supabaseAdmin } from '@/lib/supabase'

// Investment services
export const investmentService = {
  // Get user investments
  getUserInvestments: async (userId) => {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Create new investment
  createInvestment: async (investmentData) => {
    const { data, error } = await supabase
      .from('investments')
      .insert([investmentData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Update investment
  updateInvestment: async (id, updates) => {
    const { data, error } = await supabase
      .from('investments')
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Get all investments (admin)
  getAllInvestments: async () => {
    const { data, error } = await supabaseAdmin
      .from('investments')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// Network services
export const networkService = {
  // Get user network
  getUserNetwork: async (userId) => {
    const { data, error } = await supabase
      .from('network_relations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Create network relation
  createNetworkRelation: async (relationData) => {
    const { data, error } = await supabase
      .from('network_relations')
      .insert([relationData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Get user referrals
  getUserReferrals: async (userId) => {
    const { data, error } = await supabase
      .from('network_relations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('level', { ascending: true })
    
    if (error) throw error
    return data
  }
}

// Transaction services
export const transactionService = {
  // Get user transactions
  getUserTransactions: async (userId, limit = 50) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  // Create transaction
  createTransaction: async (transactionData) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Update transaction
  updateTransaction: async (id, updates) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Get all transactions (admin)
  getAllTransactions: async () => {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// Auth services
export const authService = {
  // Sign up
  signUp: async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Sign in
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Reset password
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }
}
