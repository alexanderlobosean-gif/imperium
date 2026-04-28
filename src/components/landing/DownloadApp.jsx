import React from 'react'
import { useTranslation } from 'react-i18next'
import { Smartphone, Chrome, Share2, Bell, Zap } from 'lucide-react'

const DownloadApp = () => {
  const { t } = useTranslation()
  return (
    <section id="download-app" className="py-16 bg-gradient-to-b from-indigo-950 via-blue-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-xl mb-6">
            <Smartphone className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('downloadApp.title')} <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">IMPERIUM</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('downloadApp.description')}
          </p>
        </div>

        {/* Install Instructions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Android / Chrome */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:border-yellow-400/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-lg flex items-center justify-center">
                <Chrome className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t('downloadApp.android.title')}</h3>
                <p className="text-sm text-gray-400">Chrome</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-300 leading-relaxed">
                <span className="text-yellow-400 font-semibold">1.</span> {t('downloadApp.android.step1')}
              </p>
              <p className="text-gray-300 leading-relaxed">
                <span className="text-yellow-400 font-semibold">2.</span> {t('downloadApp.android.step2')}
              </p>
              <p className="text-gray-300 leading-relaxed">
                <span className="text-yellow-400 font-semibold">3.</span> {t('downloadApp.android.step3')}
              </p>
              <p className="text-gray-300 leading-relaxed">
                <span className="text-yellow-400 font-semibold">4.</span> {t('downloadApp.android.step4')}
              </p>
            </div>

            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">
                <span className="font-semibold">💡 {t('downloadApp.tip')}:</span> {t('downloadApp.android.tip')}
              </p>
            </div>
          </div>

          {/* iPhone / Safari */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:border-yellow-400/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-cyan-600/20 rounded-lg flex items-center justify-center">
                <Share2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t('downloadApp.iphone.title')}</h3>
                <p className="text-sm text-gray-400">Safari</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-300 leading-relaxed">
                <span className="text-yellow-400 font-semibold">1.</span> {t('downloadApp.iphone.step1')}
              </p>
              <p className="text-gray-300 leading-relaxed">
                <span className="text-yellow-400 font-semibold">2.</span> {t('downloadApp.iphone.step2')}
              </p>
              <p className="text-gray-300 leading-relaxed">
                <span className="text-yellow-400 font-semibold">3.</span> {t('downloadApp.iphone.step3')}
              </p>
              <p className="text-gray-300 leading-relaxed">
                <span className="text-yellow-400 font-semibold">4.</span> {t('downloadApp.iphone.step4')}
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                <span className="font-semibold">💡 {t('downloadApp.tip')}:</span> {t('downloadApp.iphone.tip')}
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">{t('downloadApp.features.fastAccess.title')}</h4>
            <p className="text-gray-400 text-sm">{t('downloadApp.features.fastAccess.desc')}</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-yellow-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">{t('downloadApp.features.notifications.title')}</h4>
            <p className="text-gray-400 text-sm">{t('downloadApp.features.notifications.desc')}</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-yellow-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">{t('downloadApp.features.optimized.title')}</h4>
            <p className="text-gray-400 text-sm">{t('downloadApp.features.optimized.desc')}</p>
          </div>
        </div>

        {/* PWA Info */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border border-yellow-400/30 rounded-xl px-6 py-4">
            <p className="text-gray-300">
              <span className="text-yellow-400 font-semibold">PWA</span> - {t('downloadApp.pwa.title')}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {t('downloadApp.pwa.description')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DownloadApp
