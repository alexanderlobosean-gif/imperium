import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Crown, Star, Zap, Rocket, Diamond } from 'lucide-react'

const Plans = () => {
  const [billingCycle, setBillingCycle] = useState('monthly')

  const plans = [
    {
      name: "Start",
      icon: <Rocket className="w-6 h-6" />,
      price: "$50",
      period: "mínimo",
      description: "Perfeito para começar a investir",
      features: [
        "0.2% taxa diária",
        "300% retorno máximo",
        "Suporte por email",
        "Saques em 48h",
        "1 nível de rede"
      ],
      popular: false,
      color: "from-slate-600 to-slate-700"
    },
    {
      name: "Basic",
      icon: <Star className="w-6 h-6" />,
      price: "$500",
      period: "mínimo",
      description: "Para investidores iniciantes",
      features: [
        "0.3% taxa diária",
        "300% retorno máximo",
        "Suporte prioritário",
        "Saques em 24h",
        "3 níveis de rede",
        "Bônus de indicação 5%"
      ],
      popular: true,
      color: "from-yellow-400 to-yellow-600"
    },
    {
      name: "Silver",
      icon: <Crown className="w-6 h-6" />,
      price: "$1,000",
      period: "mínimo",
      description: "Investidores experientes",
      features: [
        "0.4% taxa diária",
        "300% retorno máximo",
        "Suporte VIP",
        "Saques em 12h",
        "5 níveis de rede",
        "Bônus de indicação 7%",
        "Acesso a webinars"
      ],
      popular: false,
      color: "from-slate-600 to-slate-700"
    },
    {
      name: "Gold",
      icon: <Diamond className="w-6 h-6" />,
      price: "$5,000",
      period: "mínimo",
      description: "Para investidores premium",
      features: [
        "0.5% taxa diária",
        "300% retorno máximo",
        "Suporte dedicado",
        "Saques em 6h",
        "7 níveis de rede",
        "Bônus de indicação 10%",
        "Acesso a eventos exclusivos",
        "Consultoria personalizada"
      ],
      popular: false,
      color: "from-slate-600 to-slate-700"
    }
  ]

  const leadershipPlans = [
    {
      name: "Leadership 100",
      price: "$10,000",
      period: "mínimo",
      description: "Para líderes de mercado",
      features: [
        "0.6% taxa diária",
        "300% retorno máximo",
        "Gerente pessoal",
        "Saques instantâneos",
        "10 níveis de rede",
        "Bônus de indicação 12%",
        "Eventos VIP exclusivos",
        "Retiros corporativos"
      ]
    },
    {
      name: "Leadership 2000",
      price: "$25,000",
      period: "mínimo",
      description: "O topo da elite",
      features: [
        "0.8% taxa diária",
        "300% retorno máximo",
        "Equipe dedicada",
        "Saques prioritários",
        "15 níveis de rede",
        "Bônus de indicação 15%",
        "Acesso a fundos exclusivos",
        "Parcerias estratégicas"
      ]
    }
  ]

  return (
    <section id="plans" className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Planos de <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Investimento</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Escolha o plano perfeito para suas metas financeiras e comece a construir seu futuro
          </p>
        </div>

        {/* Regular Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-slate-800/50 backdrop-blur-sm border rounded-xl p-8 hover:transform hover:scale-105 transition-all duration-300 ${
                plan.popular 
                  ? 'border-yellow-400 shadow-lg shadow-yellow-400/20' 
                  : 'border-slate-700 hover:border-yellow-400/50'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
                    MAIS POPULAR
                  </div>
                </div>
              )}

              {/* Plan Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${plan.color} rounded-lg mb-4`}>
                <div className="text-white">
                  {plan.icon}
                </div>
              </div>

              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-gray-400 mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                <div className="text-4xl font-bold text-white">{plan.price}</div>
                <div className="text-gray-400">{plan.period}</div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link 
                to="/register"
                className={`block w-full py-3 rounded-lg font-bold text-center transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-500 hover:to-yellow-700'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {plan.popular ? 'Começar Agora' : 'Selecionar Plano'}
              </Link>
            </div>
          ))}
        </div>

        {/* Leadership Plans */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-white mb-4">
            Planos <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Leadership</span>
          </h3>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Para líderes que buscam o máximo em retornos e benefícios exclusivos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {leadershipPlans.map((plan, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-8 hover:border-yellow-400/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-yellow-400">{plan.price}</div>
                  <div className="text-gray-400">{plan.period}</div>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link 
                to="/register"
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 block text-center"
              >
                Contatar Vendas
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Plans
