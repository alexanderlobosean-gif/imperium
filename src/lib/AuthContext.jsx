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
    // Get initial session
    const getInitialSession = async () => {
      console.log('Getting initial session...');
      
      // First, check if there's an OAuth callback in the URL
      const hash = window.location.hash;
      const hasAuthTokens = hash.includes('access_token=') || hash.includes('refresh_token=');
      
      if (hasAuthTokens) {
        console.log('Detected OAuth callback with tokens in URL');
        console.log('Current URL hash:', hash.substring(0, 50) + '...');
        // Wait longer for Supabase to process the tokens from URL
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Waited for token processing, checking session again...');
      }
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('Session result:', { hasSession: !!session, userId: session?.user?.id, error });
      
      if (session?.user) {
        console.log('User authenticated:', session.user.email);
        console.log('User metadata:', session.user.user_metadata);
        console.log('Email confirmed:', session.user.email_confirmed_at);
        
        // IMPORTANT: Set authenticated immediately so Dashboard doesn't redirect
        setIsAuthenticated(true);
        
        // Fetch user profile to get role and referral_code from profiles table
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, referral_code, full_name, email')
          .eq('user_id', session.user.id)
          .single();
        
        console.log('Profile result:', { profile, profileError });
        
        // If profile doesn't exist (OAuth user), create it via API
        if (!profile) {
          console.log('Profile not found for existing session, creating via API...');
          try {
            const result = await authAPI.createOAuthProfile({
              user_id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
            });
            profile = result.profile;
            console.log('Profile created successfully via API:', profile);
          } catch (apiError) {
            console.error('Error creating profile via API:', apiError);
            // Don't fail - user can still use the app, just without profile
          }
        }
        
        const userData = {
          ...session.user,
          role: profile?.role || 'user',
          referral_code: profile?.referral_code || null,
          full_name: profile?.full_name || session.user.email
        }
        
        setUser(userData)
        currentUserId.current = session.user.id
        hasInitialized.current = true
        
        // Clear the URL hash if it was an OAuth callback
        if (hasAuthTokens && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
      } else {
        console.log('No session found, user not authenticated');
      }
      
      setIsLoadingAuth(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Só loga eventos importantes, ignorando INITIAL_SESSION e TOKEN_REFRESHED
        if (event !== 'INITIAL_SESSION' && event !== 'TOKEN_REFRESHED') {
          console.log('Auth event:', event, '- User:', session?.user?.email || 'none');
        }
        
        // TOKEN_REFRESHED não deve causar logout ou recarregar estado
        if (event === 'TOKEN_REFRESHED') {
          return;
        }
        
        // Ignora eventos se o usuário não mudou (exceto SIGNED_OUT)
        if (event !== 'SIGNED_OUT' && session?.user?.id === currentUserId.current && hasInitialized.current) {
          return;
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          // IMPORTANT: Set authenticated immediately so Dashboard doesn't redirect
          setIsAuthenticated(true);
          
          // Check if profile exists
          let { data: profile } = await supabase
            .from('profiles')
            .select('role, referral_code, full_name, email')
            .eq('user_id', session.user.id)
            .single();
          
          // If profile doesn't exist (OAuth user), create it via API
          if (!profile) {
            console.log('Profile not found for OAuth user, creating via API...');
            try {
              const result = await authAPI.createOAuthProfile({
                user_id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
              });
              profile = result.profile;
              console.log('Profile created successfully via API:', profile);
            } catch (apiError) {
              console.error('Error creating profile via API:', apiError);
              // Don't fail - user can still use the app, just without profile
            }
          }
          
          const userData = {
            ...session.user,
            role: profile?.role || 'user',
            referral_code: profile?.referral_code || null,
            full_name: profile?.full_name || session.user.email
          }
          
          setUser(userData)
          currentUserId.current = session.user.id
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsAuthenticated(false)
          currentUserId.current = null
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