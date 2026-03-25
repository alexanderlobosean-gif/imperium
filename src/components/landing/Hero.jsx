import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp, Shield, Users, Crown, Sparkles } from 'lucide-react'

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            O Futuro dos Investimentos
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              IMPERIUM
            </span>
            <br />
            <span className="text-3xl md:text-5xl text-gray-300">CLUB</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transforme seu futuro com investimentos inteligentes e 
            <span className="text-yellow-400 font-semibold"> rendimentos excepcionais</span>. 
            Junte-se à elite de investidores do Imperium Club.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white">300%</div>
              <div className="text-gray-400">Retorno Máximo</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-gray-400">Investidores Ativos</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-center mb-2">
                <Shield className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-gray-400">Seguro</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-8 py-4 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
            >
              Começar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              to="/login"
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-slate-700/50 transition-all duration-200 flex items-center justify-center"
            >
              Fazer Login
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-slate-700">
            <p className="text-gray-400 mb-4">Plataforma confiada por investidores em</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-white">BTC</div>
              <div className="text-2xl font-bold text-white">ETH</div>
              <div className="text-2xl font-bold text-white">USDT</div>
              <div className="text-2xl font-bold text-white">USDC</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="animate-bounce">
          <div className="w-6 h-10 border-2 border-yellow-400/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-yellow-400 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
