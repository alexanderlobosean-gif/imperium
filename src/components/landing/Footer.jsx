import React from 'react'
import { useTranslation } from 'react-i18next'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ChevronUp } from 'lucide-react'

const Footer = () => {
  const { t } = useTranslation()
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
                <div className="flex items-center">
                  <img 
                    src="/logo_p.png" 
                    alt="Imperium Club" 
                    className="h-25 w-auto mr-3"
                  />
                  
                </div>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {t('footer.description')}
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
              <h3 className="text-lg font-semibold text-white mb-4">{t('footer.quickLinks')}</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#home" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    {t('nav.home')}
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    {t('nav.about')}
                  </a>
                </li>
                <li>
                  <a href="#plans" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    {t('nav.plans')}
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    {t('nav.testimonials')}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    {t('nav.faq')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">{t('footer.services')}</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    {t('nav.investmentPlans')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    {t('footer.referralProgram')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    {t('footer.vipSupport')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    {t('footer.exclusiveEvents')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200">
                    {t('footer.financialConsulting')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">{t('nav.contact')}</h3>
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
              {t('footer.newsletter.title')}
            </h3>
            <p className="text-gray-300 mb-6">
              {t('footer.newsletter.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={t('footer.newsletter.placeholder')}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-colors duration-200"
              />
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-6 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105">
                {t('footer.newsletter.subscribe')}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-slate-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Imperium Club. {t('footer.allRightsReserved')}
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                {t('footer.privacyPolicy')}
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                {t('footer.termsOfUse')}
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                {t('footer.cookiePolicy')}
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                {t('footer.compliance')}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 p-3 rounded-full shadow-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-110 z-40"
        aria-label={t('footer.backToTop')}
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </footer>
  )
}

export default Footer
