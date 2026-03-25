import React from 'react'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ChevronUp } from 'lucide-react'

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="mb-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  IMPERIUM
                </h1>
                <p className="text-xs text-gray-400 -mt-1">CLUB</p>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Transformando vidas através de investimentos inteligentes e oportunidades exclusivas.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#home" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    Início
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href="#plans" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    Planos de Investimento
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    Depoimentos
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Serviços</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    Planos de Investimento
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    Programa de Indicação
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    Suporte VIP
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    Eventos Exclusivos
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    Consultoria Financeira
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Contato</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-yellow-400 mr-3" />
                  <span className="text-gray-300">support@imperiumclub.asia</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-yellow-400 mr-3" />
                  <span className="text-gray-300">+55 11 9999-9999</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-yellow-400 mr-3 mt-1" />
                  <span className="text-gray-300">
                    São Paulo, Brasil<br />
                    Miami, EUA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-slate-800 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Fique por dentro das novidades
            </h3>
            <p className="text-gray-300 mb-6">
              Receba informações exclusivas sobre novos planos e oportunidades de investimento
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Seu melhor email"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-colors duration-200"
              />
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-6 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105">
                Inscrever
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-slate-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Imperium Club. Todos os direitos reservados.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                Política de Privacidade
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                Termos de Uso
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                Política de Cookies
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                Compliance
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 p-3 rounded-full shadow-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-110 z-40"
        aria-label="Voltar ao topo"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </footer>
  )
}

export default Footer
