// Referral system services
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const referralService = {
  // Generate unique referral code for user
  generateReferralCode: () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  },

  // Create profile with referral code and handle referral linking
  createProfileWithReferral: async (userId, email, fullName, referralCode = null) => {
    try {
      console.log('ReferralService: Criando perfil para userId:', userId)
      console.log('ReferralService: Código de indicação:', referralCode)
      
      let referredBy = null

      // Check if referral code is valid
      if (referralCode) {
        console.log('ReferralService: Verificando código de indicação:', referralCode)
        
        try {
          const { data: referrer, error: referrerError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('referral_code', referralCode)
            .single()

          console.log('ReferralService: Indicador encontrado:', referrer)
          console.log('ReferralService: Erro ao buscar indicador:', referrerError)

          if (referrerError || !referrer) {
            console.warn('ReferralService: Invalid referral code:', referralCode)
            // Continuar sem indicação se código for inválido
          } else {
            referredBy = referrer.user_id
            console.log('ReferralService: ID do indicador:', referredBy)
            
            // Store referral code for later processing
            localStorage.setItem('pending_referral', JSON.stringify({
              referrerId: referredBy,
              newUserId: userId,
              referralCode: referralCode
            }))
          }
        } catch (error) {
          console.error('ReferralService: Erro ao verificar código:', error)
          // Continuar sem indicação em caso de erro
        }
      }

      // Generate unique referral code for new user
      const newReferralCode = referralService.generateReferralCode()
      console.log('ReferralService: Novo código gerado:', newReferralCode)
      
      // Ensure uniqueness
      let finalReferralCode = newReferralCode
      let attempts = 0
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', finalReferralCode)
          .single()
        
        if (!existing) break
        
        finalReferralCode = referralService.generateReferralCode()
        attempts++
      }

      // Create profile
      console.log('ReferralService: Tentando criar perfil com dados:', {
        user_id: userId,
        email: email,
        full_name: fullName,
        referral_code: finalReferralCode,
        referred_by: referredBy,
        status: 'active'
      })

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: email,
          full_name: fullName,
          referral_code: finalReferralCode,
          referred_by: referredBy,
          status: 'active'
        })
        .select()
        .single()

      console.log('ReferralService: Perfil criado:', data)
      console.log('ReferralService: Erro ao criar perfil:', error)

      if (error) {
        console.error('ReferralService: Erro detalhado:', error)
        throw new Error(`Erro ao criar perfil: ${error.message}`)
      }

      // If there was a valid referral, create network relation
      if (referredBy) {
        console.log('ReferralService: Chamando createNetworkRelation...')
        console.log('ReferralService: referredBy:', referredBy)
        console.log('ReferralService: userId:', userId)
        console.log('ReferralService: referralCode:', referralCode)
        
        try {
          await referralService.createNetworkRelation(referredBy, userId, referralCode)
          console.log('ReferralService: createNetworkRelation executada com sucesso')
        } catch (relationError) {
          console.error('ReferralService: Erro ao executar createNetworkRelation:', relationError)
        }
      } else {
        console.log('ReferralService: Sem indicador válido, pulando criação de relação')
      }

      return data
    } catch (error) {
      console.error('Error creating profile with referral:', error)
      throw error
    }
  },

  // Create network relation between referrer and referred user
  createNetworkRelation: async (referrerId, referredId, referralCode) => {
    try {
      console.log('ReferralService: Criando relação de rede')
      console.log('ReferralService: ReferrerId:', referrerId)
      console.log('ReferralService: ReferredId:', referredId)
      console.log('ReferralService: ReferralCode:', referralCode)
      
      const { data, error } = await supabase
        .from('network_relations')
        .insert({
          referrer_id: referrerId,
          referred_id: referredId,
          referral_code: referralCode,
          level: 1,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      console.log('ReferralService: Relação criada:', data)
      console.log('ReferralService: Erro na relação:', error)

      if (error) throw error

      // Update referrer's referral count
      // Skip update for now - pode ser implementado depois
      // await supabase.rpc('increment_referral_count', { user_id: referrerId })

      return data
    } catch (error) {
      console.error('ReferralService: Error creating network relation:', error)
      throw error
    }
  },

  // Get user's referral link
  getReferralLink: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', userId)
        .single()

      if (error) throw error

      const baseUrl = window.location.origin
      return `${baseUrl}?ref=${data.referral_code}`
    } catch (error) {
      console.error('Error getting referral link:', error)
      return null
    }
  },

  // Get user's referrals (people they referred)
  getUserReferrals: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          created_at,
          status,
          investments:amount,
          investments:status
        `)
        .eq('referred_by', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting user referrals:', error)
      return []
    }
  },

  // Get referral statistics
  getReferralStats: async (userId) => {
    try {
      const { data: referrals, error: referralsError } = await supabase
        .from('profiles')
        .select('id, status, created_at')
        .eq('referred_by', userId)

      if (referralsError) throw referralsError

      const totalReferrals = referrals?.length || 0
      const activeReferrals = referrals?.filter(r => r.status === 'active').length || 0

      // Get total earnings from referrals (would need to implement commission calculation)
      const { data: commissions, error: commissionsError } = await supabase
        .from('commissions')
        .select('amount')
        .eq('referrer_id', userId)
        .eq('type', 'referral')

      const totalEarnings = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0

      return {
        totalReferrals,
        activeReferrals,
        totalEarnings,
        referralLink: await referralService.getReferralLink(userId)
      }
    } catch (error) {
      console.error('Error getting referral stats:', error)
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: 0,
        referralLink: null
      }
    }
  },

  // Validate referral code
  validateReferralCode: async (referralCode) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, status')
        .eq('referral_code', referralCode)
        .single()

      if (error) return { valid: false, error: error.message }
      
      return {
        valid: true,
        referrer: data
      }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  },

  // Process pending referral after user completes registration
  processPendingReferral: async (userId) => {
    try {
      const pendingReferral = localStorage.getItem('pending_referral')
      if (!pendingReferral) return

      const { referrerId, newUserId, referralCode } = JSON.parse(pendingReferral)
      
      // Verify this is the correct user
      if (newUserId !== userId) return

      // Create network relation
      await referralService.createNetworkRelation(referrerId, userId, referralCode)
      
      // Clear pending referral
      localStorage.removeItem('pending_referral')

      console.log('Referral processed successfully')
    } catch (error) {
      console.error('Error processing pending referral:', error)
    }
  }
}
