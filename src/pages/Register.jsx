import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Shield, Lock, Mail, User, Phone, FileText } from 'lucide-react'
import { authService } from '@/api/supabaseServices'

const Register = () => {
  const [searchParams] = useSearchParams()
  const referralCode = searchParams.get('ref')
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    documentNumber: '',
    password: '',
    confirmPassword: '',
    referralCode: referralCode || '',
    acceptTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
    if (error) setError('')
  }

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Preencha todos os campos obrigatórios')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return false
    }
    
    if (!formData.acceptTerms) {
      setError('Você deve aceitar os termos de uso')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await authService.signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName,
          phone: formData.phone,
          document_number: formData.documentNumber,
          referral_code: formData.referralCode
        }
      )
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Conta Criada com Sucesso!
            </h2>
            <p className="text-slate-600 mb-4">
              Enviamos um email de confirmação para {formData.email}
            </p>
            <p className="text-sm text-slate-500">
              Redirecionando para a página de login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Register Form */}
          <div className="bg-white rounded-2xl p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Criar Conta
                </h2>
                <p className="text-slate-600">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-yellow-600 hover:text-yellow-700 font-semibold">
                    Entre aqui
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
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-gray-900"
                      placeholder="João Silva"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
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

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-gray-900"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                {/* Document */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CPF/CNPJ
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="documentNumber"
                      value={formData.documentNumber}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-gray-900"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Senha *
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-gray-900"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Referral Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Código de Indicação
                  </label>
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-gray-900"
                    placeholder="Opcional"
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="w-4 h-4 text-yellow-600 border-slate-300 rounded focus:ring-yellow-500 mt-1"
                  />
                  <label className="ml-2 text-sm text-slate-600">
                    Eu concordo com os{' '}
                    <a href="#" className="text-yellow-600 hover:text-yellow-700">
                      Termos de Uso
                    </a>{' '}
                    e{' '}
                    <a href="#" className="text-yellow-600 hover:text-yellow-700">
                      Política de Privacidade
                    </a>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Criando Conta...' : 'Criar Conta'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Side - Info Card */}
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
                Junte-se à Elite de Investidores
              </h2>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Crie sua conta e comece a transformar seu futuro com 
                investimentos inteligentes e rendimentos excepcionais.
              </p>

              {/* Benefits */}
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-400 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Cadastro Rápido</h3>
                    <p className="text-gray-400 text-sm">Crie sua conta em menos de 2 minutos</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-400 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Bônus de Boas-vindas</h3>
                    <p className="text-gray-400 text-sm">Ganhe benefícios exclusivos ao se cadastrar</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-400 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Suporte Prioritário</h3>
                    <p className="text-gray-400 text-sm">Assistência dedicada desde o primeiro dia</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">300%</div>
                  <div className="text-xs text-gray-400">Retorno Máx</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">0.2%</div>
                  <div className="text-xs text-gray-400">Taxa Diária</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">24h</div>
                  <div className="text-xs text-gray-400">Saques</div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 pt-8 border-t border-slate-700">
                <p className="text-gray-400 mb-4">Plataforma confiada por investidores em</p>
                <div className="flex flex-wrap justify-center items-center gap-6 opacity-60">
                  <div className="text-xl font-bold text-white">BTC</div>
                  <div className="text-xl font-bold text-white">ETH</div>
                  <div className="text-xl font-bold text-white">USDT</div>
                  <div className="text-xl font-bold text-white">USDC</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
