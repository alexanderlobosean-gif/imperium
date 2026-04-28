import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Search, 
  Book, 
  Video, 
  FileText, 
  MessageCircle, 
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Users,
  CreditCard,
  Shield,
  TrendingUp,
  Settings,
  Globe,
  Award,
  ArrowRight
} from 'lucide-react'

const HelpCenter = () => {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedArticle, setExpandedArticle] = useState(null)

  const categories = [
    {
      id: 'getting-started',
      name: t('helpCenter.gettingStarted'),
      icon: <Book className="w-6 h-6" />,
      description: t('helpCenter.gettingStartedDesc', 'Comece a usar a plataforma'),
      color: 'blue'
    },
    {
      id: 'account',
      name: t('helpCenter.myAccount'),
      icon: <Users className="w-6 h-6" />,
      description: t('helpCenter.myAccountDesc'),
      color: 'green'
    },
    {
      id: 'investments',
      name: t('helpCenter.investments'),
      icon: <CreditCard className="w-6 h-6" />,
      description: t('helpCenter.investmentsDesc', 'Planos, rendimentos e saques'),
      color: 'yellow'
    },
    {
      id: 'security',
      name: t('helpCenter.security'),
      icon: <Shield className="w-6 h-6" />,
      description: t('helpCenter.securityDesc'),
      color: 'red'
    },
    {
      id: 'features',
      name: t('helpCenter.features'),
      icon: <Settings className="w-6 h-6" />,
      description: t('helpCenter.featuresDesc'),
      color: 'purple'
    },
    {
      id: 'troubleshooting',
      name: t('helpCenter.troubleshooting'),
      icon: <HelpCircle className="w-6 h-6" />,
      description: t('helpCenter.troubleshootingDesc'),
      color: 'orange'
    }
  ]

  const articles = {
    'getting-started': [
      {
        id: 'what-is-imperium',
        title: t('helpCenter.whatIsImperium'),
        content: t('helpCenter.whatIsImperiumContent'),
        tags: ['básico', 'plataforma']
      },
      {
        id: 'how-to-start',
        title: t('helpCenter.howToStart'),
        content: t('helpCenter.howToStartContent'),
        tags: ['início', 'passo a passo']
      },
      {
        id: 'plans-overview',
        title: t('helpCenter.availablePlans'),
        content: t('helpCenter.availablePlansContent'),
        tags: ['planos', 'valores']
      }
    ],
    'account': [
      {
        id: 'create-account',
        title: t('helpCenter.createAccount'),
        content: t('helpCenter.createAccountContent'),
        tags: ['cadastro', 'registro']
      },
      {
        id: 'reset-password',
        title: t('helpCenter.resetPassword'),
        content: t('helpCenter.resetPasswordContent'),
        tags: ['senha', 'recuperação']
      },
      {
        id: 'update-profile',
        title: t('helpCenter.updateProfile'),
        content: t('helpCenter.updateProfileContent'),
        tags: ['perfil', 'dados']
      }
    ],
    'investments': [
      {
        id: 'how-yields-work',
        title: t('helpCenter.howYieldsWork'),
        content: t('helpCenter.howYieldsWorkContent'),
        tags: ['rendimentos', 'cálculo']
      },
      {
        id: 'withdrawal-process',
        title: t('helpCenter.withdrawalProcess'),
        content: t('helpCenter.withdrawalProcessContent'),
        tags: ['saques', 'retirada']
      },
      {
        id: 'compound-interest',
        title: t('helpCenter.compoundInterest', 'O que é juros compostos?'),
        content: t('helpCenter.compoundInterestContent', 'Juros compostos significam que seus rendimentos diários são reinvestidos automaticamente, gerando mais rendimentos no dia seguinte. Isso cria um efeito bola de neve que acelera seu crescimento financeiro.'),
        tags: ['juros', 'crescimento']
      }
    ],
    'security': [
      {
        id: 'data-protection',
        title: 'Meus dados estão seguros?',
        content: 'Sim! Utilizamos criptografia SSL de 256 bits, autenticação de dois fatores e monitoramento 24/7. Seus dados são armazenados em servidores seguros e nunca compartilhamos informações com terceiros.',
        tags: ['segurança', 'privacidade']
      },
      {
        id: 'two-factor-auth',
        title: 'Como ativar autenticação de dois fatores?',
        content: 'Acesse Configurações > Segurança > Autenticação de Dois Fatores. Escaneie o QR Code com seu app autenticador e digite o código para ativar. Isso adiciona uma camada extra de segurança à sua conta.',
        tags: ['2FA', 'autenticação']
      }
    ],
    'features': [
      {
        id: 'referral-program',
        title: 'Como funciona o programa de indicação?',
        content: 'Indique amigos e ganhe 10% sobre o primeiro depósito deles. Seu indicado também recebe um bônus especial. Acesse "Indicações" no menu para obter seu link único e acompanhar suas comissões.',
        tags: ['indicação', 'comissões']
      },
      {
        id: 'mobile-app',
        title: 'Existe aplicativo móvel?',
        content: 'Nossa plataforma é 100% responsiva e funciona perfeitamente em celulares e tablets. Também estamos desenvolvendo aplicativos nativos para iOS e Android que serão lançados em breve.',
        tags: ['mobile', 'app']
      }
    ],
    'troubleshooting': [
      {
        id: 'login-issues',
        title: 'Não consigo fazer login',
        content: 'Verifique: 1) E-mail e senha corretos. 2) Caps Lock desativado. 3) Limpe o cache do navegador. 4) Tente resetar sua senha. Se o problema persistir, contate nosso suporte.',
        tags: ['login', 'acesso']
      },
      {
        id: 'deposit-not-showing',
        title: 'Meu depósito não apareceu',
        content: 'Depósitos podem levar até 30 minutos para serem processados. Verifique seu e-mail para confirmação. Se após 1 hora o valor não aparecer, entre em contato com o suporte com o comprovante.',
        tags: ['depósito', 'processamento']
      }
    ]
  }

  const filteredCategories = categories.filter(category => {
    const categoryArticles = articles[category.id] || []
    return category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           categoryArticles.some(article => 
             article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             article.content.toLowerCase().includes(searchTerm.toLowerCase())
           )
  })

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  const toggleArticle = (articleId) => {
    setExpandedArticle(expandedArticle === articleId ? null : articleId)
  }

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-400 to-blue-600',
      green: 'from-green-400 to-green-600',
      yellow: 'from-yellow-400 to-yellow-600',
      red: 'from-red-400 to-red-600',
      purple: 'from-purple-400 to-purple-600',
      orange: 'from-orange-400 to-orange-600'
    }
    return colors[color] || 'from-gray-400 to-gray-600'
  }

  return (
    <>
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/support" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                ← {t('support.back')}
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">{t('helpCenter.title')}</h1>
                <p className="text-gray-400">{t('helpCenter.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search */}
        <div className="mb-12">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('helpCenter.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400/50 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">24/7</div>
            <div className="text-gray-400">{t('helpCenter.supportOnline', 'Suporte Online')}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">50+</div>
            <div className="text-gray-400">{t('helpCenter.articles', 'Artigos')}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">6</div>
            <div className="text-gray-400">{t('helpCenter.categories', 'Categorias')}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">98%</div>
            <div className="text-gray-400">{t('helpCenter.satisfaction', 'Satisfação')}</div>
          </div>
        </div>

        {/* Categories and Articles */}
        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-900/70 transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${getColorClasses(category.color)} bg-clip-text text-transparent`}>
                    <div className="text-white">
                      {category.icon}
                    </div>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">{category.name}</h3>
                    <p className="text-gray-400">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {articles[category.id]?.length || 0} {t('helpCenter.articles', 'artigos')}
                  </span>
                  {expandedCategory === category.id ? 
                    <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  }
                </div>
              </button>

              {/* Articles */}
              {expandedCategory === category.id && (
                <div className="border-t border-slate-700">
                  {(articles[category.id] || []).map((article) => (
                    <div
                      key={article.id}
                      className="border-b border-slate-700 last:border-b-0"
                    >
                      <button
                        onClick={() => toggleArticle(article.id)}
                        className="w-full p-6 text-left hover:bg-slate-900/30 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-2">
                              {article.title}
                            </h4>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {article.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-slate-800 text-gray-400 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 mt-1" />
                        </div>
                      </button>
                      
                      {expandedArticle === article.id && (
                        <div className="px-6 pb-6">
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <p className="text-gray-300 leading-relaxed">
                              {article.content}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border border-yellow-400/30 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              {t('helpCenter.stillNeedHelp', 'Ainda precisa de ajuda?')}
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              {t('helpCenter.supportAvailable', 'Nossa equipe de suporte está disponível 24/7 para ajudar com qualquer questão')}
            </p>
            <Link
              to="/support"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-8 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 inline-block"
            >
              {t('helpCenter.contactSupport', 'Falar com Suporte')}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default HelpCenter
