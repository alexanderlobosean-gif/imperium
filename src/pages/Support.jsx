import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Headphones, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  HelpCircle,
  FileText,
  Users,
  Shield,
  CreditCard
} from 'lucide-react'

const Support = () => {
  const [activeCategory, setActiveCategory] = useState('general')

  const categories = [
    {
      id: 'general',
      name: 'Geral',
      icon: <HelpCircle className="w-6 h-6" />,
      description: 'Dúvidas comuns e informações gerais'
    },
    {
      id: 'account',
      name: 'Conta',
      icon: <Users className="w-6 h-6" />,
      description: 'Login, cadastro e configurações de perfil'
    },
    {
      id: 'investment',
      name: 'Investimentos',
      icon: <CreditCard className="w-6 h-6" />,
      description: 'Planos, rendimentos e saques'
    },
    {
      id: 'security',
      name: 'Segurança',
      icon: <Shield className="w-6 h-6" />,
      description: 'Proteção de dados e medidas de segurança'
    }
  ]

  const quickActions = [
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'Chat ao Vivo',
      description: 'Converse com nossa equipe em tempo real',
      action: 'Iniciar Chat',
      available: true
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: 'E-mail',
      description: 'Envie sua dúvida por e-mail',
      action: 'Enviar E-mail',
      available: true
    },
    {
      icon: <Phone className="w-8 h-8" />,
      title: 'Telefone',
      description: 'Suporte telefônico das 9h às 18h',
      action: 'Ligar Agora',
      available: false
    }
  ]

  const commonIssues = [
    {
      category: 'general',
      title: 'Como funciona a Imperium Club?',
      description: 'Entenda nossa plataforma de investimentos automatizados'
    },
    {
      category: 'account',
      title: 'Como resetar minha senha?',
      description: 'Passo a passo para recuperar sua conta'
    },
    {
      category: 'investment',
      title: 'Quais são as taxas de rendimento?',
      description: 'Conheça nossos planos e retornos'
    },
    {
      category: 'security',
      title: 'Meus dados estão seguros?',
      description: 'Medidas de segurança que adotamos'
    }
  ]

  const filteredIssues = commonIssues.filter(issue => 
    activeCategory === 'general' || issue.category === activeCategory
  )

  return (
    <>
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                ← Voltar
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Central de Suporte</h1>
                <p className="text-gray-400">Estamos aqui para ajudar</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Como podemos <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">ajudar?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`p-6 rounded-xl border transition-all duration-300 ${
                  activeCategory === category.id
                    ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-400/50'
                    : 'bg-slate-900/50 border-slate-700 hover:border-yellow-400/30'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-3 rounded-lg ${
                    activeCategory === category.id
                      ? 'bg-yellow-400/20 text-yellow-400'
                      : 'bg-slate-800 text-gray-400'
                  }`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-400">{category.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">Contato Rápido</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className={`bg-slate-900/50 border border-slate-700 rounded-xl p-6 ${
                  action.available ? 'hover:border-yellow-400/50' : 'opacity-60'
                } transition-all duration-300`}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`p-3 rounded-lg ${
                    action.available ? 'bg-yellow-400/20 text-yellow-400' : 'bg-slate-800 text-gray-500'
                  }`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{action.title}</h4>
                    <p className="text-sm text-gray-400">{action.description}</p>
                  </div>
                </div>
                <button
                  className={`w-full py-2 rounded-lg font-medium transition-all duration-200 ${
                    action.available
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-500 hover:to-yellow-700'
                      : 'bg-slate-800 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!action.available}
                >
                  {action.action}
                </button>
                {!action.available && (
                  <div className="flex items-center justify-center mt-2 text-gray-500 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    Indisponível no momento
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Common Issues */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">
            Tópicos Comuns - {categories.find(c => c.id === activeCategory)?.name}
          </h3>
          <div className="space-y-4">
            {filteredIssues.map((issue, index) => (
              <div
                key={index}
                className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 hover:border-yellow-400/50 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                      {issue.title}
                    </h4>
                    <p className="text-gray-400 text-sm">{issue.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-yellow-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Center CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border border-yellow-400/30 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Não encontrou o que procura?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Nossa Central de Ajuda completa está disponível com guias detalhados e tutoriais passo a passo
            </p>
            <Link
              to="/help-center"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-8 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 inline-block"
            >
              Visitar Central de Ajuda
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Support
