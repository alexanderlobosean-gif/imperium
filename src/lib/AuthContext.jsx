import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { authAPI } from '@/services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [appPublicSettings, setAppPublicSettings] = useState(null)
  const hasInitialized = useRef(false)
  const currentUserId = useRef(null)

  useEffect(() => {
    let mounted = true

    // Fallback de segurança: nunca deixar a app presa no loading
    // (evita spinner infinito se o Supabase demorar a responder)
    const safetyTimeout = setTimeout(() => {
      if (mounted) setIsLoadingAuth(false)
    }, 12000)

    const hydrateUser = (session) => {
      const baseUser = {
        ...session.user,
        role: 'user',
        referral_code: null,
        full_name: session.user.email
      }
      setUser(baseUser)
      currentUserId.current = session.user.id
      hasInitialized.current = true
      setIsLoadingAuth(false)
      return baseUser
    }

    // Enriquecimento de perfil em background (não bloqueia o loading)
    const loadProfile = async (session) => {
      let profile = null

      try {
        const { data } = await supabase
          .from('profiles')
          .select('role, referral_code, full_name, email')
          .eq('user_id', session.user.id)
          .single()
        profile = data
      } catch (e) {
        console.error('Erro ao buscar profile:', e)
      }

      if (!profile) {
        try {
          const result = await authAPI.createOAuthProfile({
            user_id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
          })
          profile = result.profile
        } catch (apiError) {
          console.error('Error creating profile via API:', apiError)
        }
      }

      if (!mounted) return

      setUser(prev => ({
        ...prev,
        role: profile?.role || prev?.role || 'user',
        referral_code: profile?.referral_code ?? prev?.referral_code,
        full_name: profile?.full_name || prev?.full_name || session.user.email
      }))
    }

    // Fonte única de verdade: o evento INITIAL_SESSION/SIGNED_IN do listener.
    // NÃO chamar getSession() manualmente em paralelo — evita deadlock do
    // GoTrueClient quando há sessão no storage (causa de login travar).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED') return

        if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null)
            setIsAuthenticated(false)
            currentUserId.current = null
            setIsLoadingAuth(false)
          }
          return
        }

        if (!session?.user) {
          if (mounted) setIsLoadingAuth(false)
          return
        }

        // Mesmo usuário já inicializado: só garante o fim do loading
        if (hasInitialized.current && session.user.id === currentUserId.current) {
          if (mounted) setIsLoadingAuth(false)
          return
        }

        if (!mounted) return

        setIsAuthenticated(true)
        hydrateUser(session)
        loadProfile(session)

        // Limpa hash de OAuth da URL
        const hash = window.location.hash
        if ((hash.includes('access_token=') || hash.includes('refresh_token=')) && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
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