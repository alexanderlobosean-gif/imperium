import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, Lock, Mail, User } from 'lucide-react'
import { authService } from '@/api/supabaseServices'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
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
      const { data, error } = await authService.signIn(formData.email, formData.password)
      
      if (error) {
        setError(error.message)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
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
                Bem-vindo de volta!
              </h2>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Entre na sua conta para acessar seus investimentos, 
                acompanhar rendimentos e gerenciar seu portfólio.
              </p>

              {/* Features */}
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold">Segurança Máxima</h3>
                    <p className="text-gray-400 text-sm">Seus dados protegidos com criptografia avançada</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold">Acesso Rápido</h3>
                    <p className="text-gray-400 text-sm">Interface intuitiva e navegação simplificada</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold">Suporte Premium</h3>
                    <p className="text-gray-400 text-sm">Assistência dedicada 24/7 para membros</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">10K+</div>
                  <div className="text-xs text-gray-400">Membros</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">$50M+</div>
                  <div className="text-xs text-gray-400">Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">98%</div>
                  <div className="text-xs text-gray-400">Satisfação</div>
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
                  Entrar na Conta
                </h2>
                <p className="text-slate-600">
                  Não tem uma conta?{' '}
                  <Link to="/register" className="text-yellow-600 hover:text-yellow-700 font-semibold">
                    Cadastre-se
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
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
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
                      className="w-4 h-4 text-yellow-600 border-slate-300 rounded focus:ring-yellow-500"
                    />
                    <span className="ml-2 text-sm text-slate-600">Lembrar-me</span>
                  </label>
                  <a href="#" className="text-sm text-yellow-600 hover:text-yellow-700">
                    Esqueceu a senha?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Entrando...' : 'Entrar na Conta'}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-sm text-slate-500">
                  Ao entrar, você concorda com nossos{' '}
                  <a href="#" className="text-yellow-600 hover:text-yellow-700">
                    Termos de Uso
                  </a>{' '}
                  e{' '}
                  <a href="#" className="text-yellow-600 hover:text-yellow-700">
                    Política de Privacidade
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
