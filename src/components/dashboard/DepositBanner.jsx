import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, TrendingUp, Clock, DollarSign, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

const DepositBanner = () => {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Verificar se o usuário já fez algum depósito
    const checkDepositStatus = async () => {
      if (!user?.id) {
        console.log('DepositBanner: Usuário não logado')
        return
      }

      try {
        console.log('DepositBanner: Verificando depósitos para usuário:', user.id)
        
        const { data: deposits, error: depositError } = await supabase
          .from('deposits')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
        
        const { data: investments, error: investmentError } = await supabase
          .from('investments')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        console.log('DepositBanner: Depósitos encontrados:', deposits?.length || 0)
        console.log('DepositBanner: Investimentos encontrados:', investments?.length || 0)
        console.log('DepositBanner: Erro depósitos:', depositError)
        console.log('DepositBanner: Erro investimentos:', investmentError)

        // Mostrar banner se não tiver depósitos ou investimentos
        if ((!deposits || deposits.length === 0) && (!investments || investments.length === 0)) {
          console.log('DepositBanner: Mostrando banner - sem depósitos/investimentos')
          setIsVisible(true)
        } else {
          console.log('DepositBanner: Escondendo banner - tem depósitos/investimentos')
          setIsVisible(false)
        }
      } catch (error) {
        console.error('DepositBanner: Erro ao verificar status de depósito:', error)
      }
    }

    // Sempre verificar status de depósito (removido localStorage)
    checkDepositStatus()
    setIsDismissed(false)
  }, [user?.id])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    // Removido localStorage para sempre mostrar até primeiro depósito
  }

  const handleDepositNow = () => {
    setIsVisible(false)
    // Redirecionar para página de depósito
    window.location.href = '/deposit'
  }

  if (!isVisible || isDismissed) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-auto shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full">
              <img 
                src="/logo.png" 
                alt="Imperium Club" 
                className="w-8 h-8"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Comece a Investir!</h3>
              <p className="text-sm text-gray-400">Sua jornada financeira começa aqui</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border border-yellow-400/30 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">Comece em 24 horas</span>
            </div>
            <p className="text-gray-300 text-sm">
              Faça seu primeiro depósito e comece a ver rendimentos já no primeiro dia
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">A partir de</div>
              <div className="text-sm font-bold text-white">R$ 10</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Até</div>
              <div className="text-sm font-bold text-white">3% ao dia</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <Clock className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Saques em</div>
              <div className="text-sm font-bold text-white">24h</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-300">Rendimentos diários automáticos</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-300">Segurança e confiança garantidas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-300">Suporte 24/7 dedicado</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleDepositNow}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-6 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <DollarSign className="w-5 h-5" />
            <span>Fazer Depósito Agora</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-full bg-slate-800 text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-slate-700 transition-all duration-200 border border-slate-600"
          >
            Depois
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-700 text-center">
          <p className="text-xs text-gray-500">
            🎯 <span className="text-yellow-400">Dica:</span> Comece pequeno e veja seu dinheiro crescer todos os dias
          </p>
        </div>
      </div>
    </div>
  )
}

export default DepositBanner
