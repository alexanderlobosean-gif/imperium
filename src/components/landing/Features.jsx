import React from 'react'
import { Link } from 'react-router-dom'
import { Zap, Shield, TrendingUp, Globe, Headphones, Award, Users } from 'lucide-react'

const Features = () => {
  const features = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Rendimentos Excepcionais",
      description: "Até 300% de retorno sobre seus investimentos com taxas diárias competitivas e planos flexíveis."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Segurança Máxima",
      description: "Sua proteção é nossa prioridade com criptografia avançada e fundos de seguro garantidos."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Comunidade Exclusiva",
      description: "Faça parte da elite de investidores com acesso a conteúdo exclusivo e networking premium."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Saques Rápidos",
      description: "Processamento de saques em até 24 horas com suporte dedicado e múltiplas opções de pagamento."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Acesso Global",
      description: "Invista de qualquer lugar do mundo com nossa plataforma multilíngue e suporte 24/7."
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Programa de Rewards",
      description: "Ganhe bônus generosos através de nosso programa de indicação e recompensas por lealdade."
    }
  ]

  return (
    <section id="about" className="py-20 bg-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Por que escolher o <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">IMPERIUM CLUB</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Descubra as vantagens que tornam nossa plataforma a escolha preferida dos investidores mais exigentes
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:bg-slate-900/70 hover:border-yellow-400/50 transition-all duration-300 hover:transform hover:scale-105"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-lg mb-6 group-hover:from-yellow-400/30 group-hover:to-yellow-600/30 transition-all duration-300">
                <div className="text-yellow-400">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border border-yellow-400/30 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Comece sua jornada de investimentos hoje
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Junte-se a milhares de investidores que já estão transformando suas vidas com o Imperium Club
            </p>
            <Link 
              to="/register"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-8 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 inline-block"
            >
              Abrir Conta Gratuita
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
