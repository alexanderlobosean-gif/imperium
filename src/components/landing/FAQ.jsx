import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'

const FAQ = () => {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = t('faq.items', { returnObjects: true })

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-20 bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('faq.title.part1')} <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">{t('faq.title.part2')}</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('faq.subtitle')}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden hover:border-yellow-400/50 transition-all duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-800/50 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-white pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border border-yellow-400/30 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              {t('faq.cta.title')}
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              {t('faq.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-8 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105">
                {t('faq.cta.contactSupport')}
              </button>
              <button className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-700/50 hover:border-yellow-400 transition-all duration-200">
                {t('faq.cta.helpCenter')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FAQ
