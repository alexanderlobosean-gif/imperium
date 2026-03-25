import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: "Como funciona o Imperium Club?",
      answer: "O Imperium Club é uma plataforma de investimentos que oferece rendimentos diários através de diversos planos de investimento. Você escolhe um plano, faz seu depósito e começa a receber retornos diários até atingir 300% do seu investimento inicial."
    },
    {
      question: "É seguro investir no Imperium Club?",
      answer: "Sim, nossa plataforma utiliza criptografia avançada, fundos de seguro e auditorias regulares para garantir a segurança dos seus investimentos. Além disso, temos uma equipe dedicada à segurança e compliance."
    },
    {
      question: "Quais são os métodos de depósito disponíveis?",
      answer: "Aceitamos diversas criptomoedas incluindo Bitcoin (BTC), Ethereum (ETH), Tether (USDT), USD Coin (USDC) e outras altcoins populares. Também estamos sempre adicionando novas opções de pagamento."
    },
    {
      question: "Como funcionam os saques?",
      answer: "Os saques são processados de acordo com seu plano de investimento. Planos básicos podem levar até 48 horas, enquanto planos premium têm saques em até 6 horas. Planos Leadership contam com saques instantâneos."
    },
    {
      question: "O que é o programa de indicação?",
      answer: "Nosso programa de indicação permite que você ganhe bônus generosos ao trazer novos investidores para a plataforma. As comissões variam de 5% a 15% dependendo do seu plano, e você ainda ganha comissões sobre as indicações da sua rede."
    },
    {
      question: "Posso ter múltiplos investimentos?",
      answer: "Sim, você pode ter múltiplos investimentos ativos simultaneamente em diferentes planos. Isso permite diversificar sua carteira e otimizar seus retornos de acordo com suas metas financeiras."
    },
    {
      question: "Como são calculados os rendimentos?",
      answer: "Os rendimentos são calculados diariamente com base na taxa do seu plano e são creditados automaticamente na sua conta. As taxas variam de 0.2% a 0.8% ao dia, dependendo do plano escolhido."
    },
    {
      question: "Existe alguma taxa oculta?",
      answer: "Não, somos totalmente transparentes em nossas taxas. A única taxa aplicada é uma pequena comissão de processamento para saques, que é claramente informada antes da confirmação da transação."
    },
    {
      question: "Como funciona o suporte ao cliente?",
      answer: "Oferecemos suporte 24/7 através de email, chat ao vivo e telefone. Planos premium contam com suporte prioritário e gerentes dedicados para assistência personalizada."
    },
    {
      question: "Posso cancelar meu investimento a qualquer momento?",
      answer: "Sim, você pode solicitar o cancelamento do seu investimento a qualquer momento. No entanto, lembre-se que os rendimentos são calculados até a data do cancelamento e podem haver taxas de processamento."
    }
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-20 bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Perguntas <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Frequentes</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Tire suas dúvidas e conheça melhor como o Imperium Club pode transformar seus investimentos
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
              Ainda tem dúvidas?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Nossa equipe de suporte está pronta para ajudar. Entre em contato conosco e tire todas as suas dúvidas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-8 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105">
                Falar com Suporte
              </button>
              <button className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-700/50 hover:border-yellow-400 transition-all duration-200">
                Ver Central de Ajuda
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FAQ
