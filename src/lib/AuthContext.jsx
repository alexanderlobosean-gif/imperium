import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [appPublicSettings, setAppPublicSettings] = useState(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session) {
        // Fetch user profile to get role and referral_code from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, referral_code, full_name, email')
          .eq('user_id', session.user.id)
          .single();
        
        setUser({
          ...session.user,
          role: profile?.role || 'user',
          referral_code: profile?.referral_code || null,
          full_name: profile?.full_name || session.user.email
        })
        setIsAuthenticated(true)
      }
      
      setIsLoadingAuth(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', { event, session: session?.user });
        
        // Evitar loop infinito - só processar mudanças reais
        if (event === 'SIGNED_IN' && session?.user) {
          // Fetch user profile to get role and referral_code from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, referral_code, full_name, email')
            .eq('user_id', session.user.id)
            .single();
          
          setUser({
            ...session.user,
            role: profile?.role || 'user',
            referral_code: profile?.referral_code || null,
            full_name: profile?.full_name || session.user.email
          })
          setIsAuthenticated(true)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsAuthenticated(false)
        }
        setIsLoadingAuth(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const navigateToLogin = () => {
    window.location.href = '/login'
  }

  const checkAppState = async () => {
    // For Supabase, we don't need to check app settings like Base44
    setIsLoadingPublicSettings(false)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}