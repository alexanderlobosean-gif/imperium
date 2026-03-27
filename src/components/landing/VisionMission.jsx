import React from 'react'
import { Eye, Target, Users, TrendingUp, Shield, Globe } from 'lucide-react'

const VisionMission = () => {
  return (
    <section id="vision-mission" className="py-20 bg-gradient-to-b from-slate-800/50 to-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Nossa <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Identidade</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Conheça nossa visão de futuro e missão de transformar investidores comuns em construtores de riqueza
          </p>
        </div>

        {/* Vision and Mission Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Vision Section */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:border-yellow-400/50 transition-all duration-300">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400/20 to-blue-600/20 rounded-lg mb-6">
              <Eye className="w-8 h-8 text-blue-400" />
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Visão</span>
            </h3>
            <p className="text-gray-300 leading-relaxed text-lg mb-6">
              Capacitar indivíduos em todo o mundo com acesso descomplicado a negociações profissionais de nível institucional, transformando investidores comuns em construtores de riqueza a longo prazo.
            </p>
            
            {/* Vision Highlights */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Acesso Institucional</h4>
                  <p className="text-gray-400 text-sm">Negociações profissionais para todos</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Transformação</h4>
                  <p className="text-gray-400 text-sm">De investidores comuns a construtores de riqueza</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Globe className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Alcance Global</h4>
                  <p className="text-gray-400 text-sm">Capacitando indivíduos em todo o mundo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:border-yellow-400/50 transition-all duration-300">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-lg mb-6">
              <Target className="w-8 h-8 text-yellow-400" />
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Missão</span>
            </h3>
            <p className="text-gray-300 leading-relaxed text-lg mb-6">
              Preencher a lacuna entre a experiência profissional em negociação e os investidores do dia a dia, oferecendo soluções de negociação seguras, automatizadas e orientadas a resultados, ao mesmo tempo que possibilitamos a criação de riqueza passiva e recompensamos o crescimento da comunidade por meio de um modelo de afiliados robusto.
            </p>
            
            {/* Mission Highlights */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Soluções Seguras</h4>
                  <p className="text-gray-400 text-sm">Negociações automatizadas e orientadas a resultados</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Riqueza Passiva</h4>
                  <p className="text-gray-400 text-sm">Possibilitando criação de renda automática</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Comunidade Robusta</h4>
                  <p className="text-gray-400 text-sm">Modelo de afiliados com recompensas generosas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-yellow-400/10 to-blue-600/10 border border-yellow-400/30 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Faça parte da nossa missão
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Junte-se a nós na transformação do futuro dos investimentos e construa sua liberdade financeira
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/register"
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-8 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 inline-block"
              >
                Começar Agora
              </a>
              <a 
                href="/login"
                className="bg-slate-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-700 transition-all duration-200 transform hover:scale-105 inline-block border border-slate-600"
              >
                Já tenho conta
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default VisionMission
