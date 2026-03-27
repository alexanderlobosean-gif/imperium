import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Send,
  CheckCircle,
  AlertCircle,
  Users,
  Building,
  HelpCircle
} from 'lucide-react'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const categories = [
    { value: 'general', label: 'Dúvida Geral' },
    { value: 'technical', label: 'Suporte Técnico' },
    { value: 'billing', label: 'Financeiro' },
    { value: 'partnership', label: 'Parceria' },
    { value: 'complaint', label: 'Reclamação' }
  ]

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'E-mail',
      value: 'suporte@imperiumclub.com',
      description: 'Resposta em até 24 horas',
      available: true
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Telefone',
      value: '+55 11 9999-9999',
      description: 'Segunda a Sexta, 9h-18h',
      available: true
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'Chat ao Vivo',
      value: 'Disponível 24/7',
      description: 'Resposta imediata',
      available: true
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Endereço',
      value: 'São Paulo, SP - Brasil',
      description: 'Atendimento online apenas',
      available: false
    }
  ]

  const faqItems = [
    {
      question: 'Qual é o tempo médio de resposta?',
      answer: 'E-mails respondemos em até 24 horas. Chat ao vivo oferece resposta imediata durante o horário comercial.'
    },
    {
      question: 'Posso agendar uma chamada?',
      answer: 'Sim! Envie um e-mail com "Agendar Chamada" no assunto e nossa equipe entrará em contato.'
    },
    {
      question: 'Como faço para relatar um problema?',
      answer: 'Use o formulário de contato ou envie e-mail para suporte@imperiumclub.com com detalhes do problema.'
    }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulação de envio
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      })
    }, 2000)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (isSubmitted) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-md mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-400/20 rounded-full mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Mensagem Enviada!</h2>
              <p className="text-gray-300 mb-6">
                Sua mensagem foi recebida com sucesso. Nossa equipe responderá em até 24 horas.
              </p>
              <div className="space-y-3">
                <Link
                  to="/"
                  className="block w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-6 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
                >
                  Voltar ao Início
                </Link>
                <Link
                  to="/support"
                  className="block w-full bg-slate-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-700 transition-all duration-200 border border-slate-600"
                >
                  Central de Suporte
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/support" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                ← Voltar ao Suporte
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Fale Conosco</h1>
                <p className="text-gray-400">Estamos aqui para ajudar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Envie sua <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">mensagem</span>
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400/50 transition-all duration-300"
                      placeholder="Seu nome"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400/50 transition-all duration-300"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Categoria *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-400/50 transition-all duration-300"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assunto *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400/50 transition-all duration-300"
                    placeholder="Breve descrição do assunto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mensagem *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400/50 transition-all duration-300 resize-none"
                    placeholder="Descreva detalhadamente sua dúvida ou problema..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-6 py-4 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Enviar Mensagem</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info & FAQ */}
          <div className="space-y-8">
            {/* Contact Methods */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Formas de Contato</h3>
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 p-3 rounded-lg ${
                      info.available ? 'hover:bg-slate-800/50' : 'opacity-60'
                    } transition-all duration-300`}
                  >
                    <div className={`p-2 rounded-lg ${
                      info.available ? 'bg-yellow-400/20 text-yellow-400' : 'bg-slate-800 text-gray-500'
                    }`}>
                      {info.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{info.title}</h4>
                      <p className="text-gray-300 text-sm">{info.value}</p>
                      <p className="text-gray-500 text-xs">{info.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick FAQ */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Dúvidas Frequentes</h3>
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="border-b border-slate-700 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-start space-x-2">
                      <HelpCircle className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-white mb-2">{item.question}</h4>
                        <p className="text-gray-400 text-sm">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border border-yellow-400/30 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Horário de Atendimento</h3>
              </div>
              <div className="space-y-2 text-gray-300">
                <div className="flex justify-between">
                  <span>Segunda - Sexta:</span>
                  <span>9h - 18h</span>
                </div>
                <div className="flex justify-between">
                  <span>Sábado:</span>
                  <span>9h - 14h</span>
                </div>
                <div className="flex justify-between">
                  <span>Domingo:</span>
                  <span>Fechado</span>
                </div>
                <div className="flex justify-between font-semibold text-yellow-400">
                  <span>Chat Online:</span>
                  <span>24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Contact
