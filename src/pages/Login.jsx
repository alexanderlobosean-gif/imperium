import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Shield, Lock, Mail, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

const Login = () => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    email: localStorage.getItem('rememberedEmail') || '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'))
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Login direto no Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })
      
      if (error) {
        setError(error.message)
      } else {
        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email)
        } else {
          localStorage.removeItem('rememberedEmail')
        }
        navigate('/dashboard')
      }
    } catch (err) {
      setError(t('auth.errors.loginFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotPasswordLoading(true)
    setForgotPasswordMessage('')
    setError('')

    try {
      // Recuperação de senha direto no Supabase
      const redirectUrl = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: redirectUrl
      })
      
      if (error) throw error
      
      setForgotPasswordMessage(t('auth.resetSent'))
      setForgotPasswordEmail('')
    } catch (err) {
      setError(t('auth.errors.resetFailed'))
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setError(t('auth.errors.googleLoginFailed'))
        console.error('Google OAuth error:', error)
      }
      // Note: With OAuth, the user will be redirected to Google's login page,
      // then back to the redirectTo URL. No need to navigate here.
    } catch (err) {
      setError(t('auth.errors.googleLoginFailed'))
      console.error('Google login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Info Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 lg:p-12">
            <div className="text-center">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <div className="flex items-center">
                  <img 
                    src="/logo_p.png" 
                    alt="Imperium Club" 
                    className="h-26 w-auto mr-3"
                  />
                  
                </div>
              </div>

              {/* Welcome Message */}
              <h2 className="text-2xl font-bold text-white mb-4">
                {t('login.welcomeBack')}
              </h2>
              <p className="text-gray-300 mb-8 leading-relaxed">
                {t('login.accessAccount')}
              </p>

              {/* Features */}
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold">{t('login.features.security')}</h3>
                    <p className="text-gray-400 text-sm">{t('login.features.securityDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold">{t('login.features.fastAccess')}</h3>
                    <p className="text-gray-400 text-sm">{t('login.features.fastAccessDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold">{t('login.features.premiumSupport')}</h3>
                    <p className="text-gray-400 text-sm">{t('login.features.premiumSupportDesc')}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">10K+</div>
                  <div className="text-xs text-gray-400">{t('stats.members')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">$50M+</div>
                  <div className="text-xs text-gray-400">{t('stats.volume')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">98%</div>
                  <div className="text-xs text-gray-400">{t('stats.satisfaction')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="bg-white rounded-2xl p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  {t('login.loginTitle')}
                </h2>
                <p className="text-slate-600">
                  {t('login.noAccount')}{' '}
                  <Link to="/register" className="text-yellow-600 hover:text-yellow-700 font-semibold">
                    {t('login.registerLink')}
                  </Link>
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-gray-900"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-gray-900"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-yellow-600 border-slate-300 rounded focus:ring-yellow-500"
                    />
                    <span className="ml-2 text-sm text-slate-600">{t('login.rememberMe')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-yellow-600 hover:text-yellow-700"
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('login.loggingIn') : t('login.submit')}
                </button>
              </form>

              {/* Forgot Password Modal */}
              {showForgotPassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">
                      {t('login.resetTitle')}
                    </h3>
                    
                    {forgotPasswordMessage ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-green-600 text-sm">{forgotPasswordMessage}</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-600 mb-6">
                          {t('login.resetDescription')}
                        </p>
                        
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              {t('auth.email')}
                            </label>
                            <input
                              type="email"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              required
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-gray-900"
                              placeholder="seu@email.com"
                            />
                          </div>
                          
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(false)}
                              className="flex-1 py-3 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              {t('buttons.cancel')}
                            </button>
                            <button
                              type="submit"
                              disabled={forgotPasswordLoading}
                              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-50"
                            >
                              {forgotPasswordLoading ? t('buttons.sending') : t('buttons.sendLink')}
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                    
                    {forgotPasswordMessage && (
                      <button
                        onClick={() => {
                          setShowForgotPassword(false)
                          setForgotPasswordMessage('')
                        }}
                        className="w-full mt-4 py-3 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {t('buttons.close')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">{t('login.orContinueWith')}</span>
                </div>
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-300 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GoogleIcon />
                {isLoading ? t('login.connecting') : t('login.loginWithGoogle')}
              </button>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-sm text-slate-500">
                  {t('login.termsText')}{' '}
                  <a href="#" className="text-yellow-600 hover:text-yellow-700">
                    {t('login.termsLink')}
                  </a>{' '}
                  {t('login.and')}{' '}
                  <a href="#" className="text-yellow-600 hover:text-yellow-700">
                    {t('login.privacyLink')}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
