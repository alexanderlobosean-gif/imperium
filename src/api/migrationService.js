// Migration service for existing users
import { supabase } from '@/lib/supabase'

export const migrationService = {
  // Generate referral code for existing users
  generateReferralCodeForUser: () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  },

  // Update existing users without referral codes
  updateExistingUsersWithReferralCodes: async () => {
    try {
      // Get all users without referral codes
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, user_id, email')
        .is('referral_code', null)

      if (error) throw error

      console.log(`Found ${users.length} users without referral codes`)

      // Generate and update referral codes
      for (const user of users) {
        let referralCode = migrationService.generateReferralCodeForUser()
        
        // Ensure uniqueness
        let attempts = 0
        while (attempts < 10) {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', referralCode)
            .single()
          
          if (!existing) break
          
          referralCode = migrationService.generateReferralCodeForUser()
          attempts++
        }

        // Update user with referral code
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ referral_code: referralCode })
          .eq('id', user.id)

        if (updateError) {
          console.error(`Error updating user ${user.id}:`, updateError)
        } else {
          console.log(`Generated referral code ${referralCode} for user ${user.email}`)
        }
      }

      return { success: true, updated: users.length }
    } catch (error) {
      console.error('Error updating existing users:', error)
      return { success: false, error: error.message }
    }
  },

  // Get or generate referral code for specific user
  getOrGenerateReferralCode: async (userId) => {
    try {
      // First try to get existing referral code
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      // If user has referral code, return it
      if (profile?.referral_code) {
        return profile.referral_code
      }

      // Generate new referral code
      let referralCode = migrationService.generateReferralCodeForUser()
      
      // Ensure uniqueness
      let attempts = 0
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode)
          .single()
        
        if (!existing) break
        
        referralCode = migrationService.generateReferralCodeForUser()
        attempts++
      }

      // Update user profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ referral_code: referralCode })
        .eq('user_id', userId)
        .select('referral_code')
        .single()

      if (updateError) throw updateError

      console.log(`Generated referral code ${referralCode} for user ${userId}`)
      return updatedProfile.referral_code
    } catch (error) {
      console.error('Error getting/generating referral code:', error)
      throw error
    }
  }
}
