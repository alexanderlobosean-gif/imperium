import React, { useState } from 'react'
import { Star, Quote } from 'lucide-react'

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0)

  const testimonials = [
    {
      name: "Carlos Silva",
      role: "Empreendedor",
      location: "São Paulo, Brasil",
      content: "O Imperium Club transformou completamente minha vida financeira. Comecei com o plano Basic e já estou nos planos Leadership. Os rendimentos são consistentes e o suporte é excepcional.",
      rating: 5,
      investment: "$5,000",
      returns: "+$12,500"
    },
    {
      name: "Maria Santos",
      role: "Investidora",
      location: "Rio de Janeiro, Brasil",
      content: "Nunca imaginei que poderia alcançar tão bons resultados. A plataforma é intuitiva, segura e os saques são sempre processados rapidamente. Recomendo a todos!",
      rating: 5,
      investment: "$1,000",
      returns: "+$2,800"
    },
    {
      name: "João Oliveira",
      role: "Trader",
      location: "Lisboa, Portugal",
      content: "Como trader profissional, avaliei várias plataformas e o Imperium Club superou todas as expectativas. A transparência e os resultados falam por si só.",
      rating: 5,
      investment: "$10,000",
      returns: "+$28,000"
    },
    {
      name: "Ana Costa",
      role: "Consultora Financeira",
      location: "Miami, EUA",
      content: "O programa de indicação é fantástico! Além dos meus investimentos, ganho comissões generosas. A comunidade é muito acolhedora e sempre disposta a ajudar.",
      rating: 5,
      investment: "$500",
      returns: "+$1,400"
    },
    {
      name: "Pedro Martins",
      role: "Engenheiro",
      location: "Porto Alegre, Brasil",
      content: "Segurança é minha prioridade e o Imperium Club entrega isso em todos os níveis. Meus rendimentos são estáveis e posso dormir tranquilo sabendo que meu dinheiro está seguro.",
      rating: 5,
      investment: "$2,000",
      returns: "+$5,200"
    },
    {
      name: "Lucia Fernandez",
      role: "Designer",
      location: "Barcelona, Espanha",
      content: "A interface da plataforma é incrível e o suporte ao cliente é impecável. Comecei pequena e hoje tenho uma carteira diversificada que me traz tranquilidade financeira.",
      rating: 5,
      investment: "$250",
      returns: "+$650"
    }
  ]

  const stats = [
    { value: "10K+", label: "Investidores Ativos" },
    { value: "98%", label: "Satisfação" },
    { value: "$50M+", label: "Volume Total" },
    { value: "24/7", label: "Suporte" }
  ]

  return (
    <section id="testimonials" className="py-20 bg-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            O que nossos <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">investidores</span> dizem
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Histórias reais de sucesso e transformação financeira através do Imperium Club
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">{stat.value}</div>
              <div className="text-gray-300">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-yellow-400/50 transition-all duration-300 hover:transform hover:scale-105"
            >
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-yellow-400/20 mb-4" />

              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Investment Info */}
              <div className="flex justify-between mb-4 text-sm">
                <div>
                  <span className="text-gray-400">Investimento:</span>
                  <span className="text-white ml-2 font-semibold">{testimonial.investment}</span>
                </div>
                <div>
                  <span className="text-gray-400">Retorno:</span>
                  <span className="text-green-400 ml-2 font-semibold">{testimonial.returns}</span>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-slate-900 font-bold mr-3">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-semibold">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role} • {testimonial.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border border-yellow-400/30 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Junte-se a milhares de investidores satisfeitos
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Comece sua jornada hoje mesmo e descubra por que o Imperium Club é a escolha número um
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-8 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105">
                Começar Agora
              </button>
              <button className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-700/50 hover:border-yellow-400 transition-all duration-200">
                Ver Mais Depoimentos
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
