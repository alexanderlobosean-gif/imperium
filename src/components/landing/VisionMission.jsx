import React from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, Target, Users, TrendingUp, Shield, Globe } from 'lucide-react'

const VisionMission = () => {
  const { t } = useTranslation()
  return (
    <section id="vision-mission" className="py-20 bg-gradient-to-b from-slate-800/50 to-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('visionMission.title')} <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">{t('visionMission.highlight')}</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('visionMission.subtitle')}
          </p>
        </div>

        {/* Vision and Mission Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Vision Section */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:border-yellow-400/50 transition-all duration-300">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400/20 to-blue-600/20 rounded-lg mb-6">
              <Eye className="w-8 h-8 text-blue-400" />
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">{t('visionMission.vision.title')}</span>
            </h3>
            <p className="text-gray-300 leading-relaxed text-lg mb-6">
              {t('visionMission.vision.description')}
            </p>
            
            {/* Vision Highlights */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">{t('visionMission.vision.highlights.0.title')}</h4>
                  <p className="text-gray-400 text-sm">{t('visionMission.vision.highlights.0.desc')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">{t('visionMission.vision.highlights.1.title')}</h4>
                  <p className="text-gray-400 text-sm">{t('visionMission.vision.highlights.1.desc')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Globe className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">{t('visionMission.vision.highlights.2.title')}</h4>
                  <p className="text-gray-400 text-sm">{t('visionMission.vision.highlights.2.desc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:border-yellow-400/50 transition-all duration-300">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-lg mb-6">
              <Target className="w-8 h-8 text-yellow-400" />
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">{t('visionMission.mission.title')}</span>
            </h3>
            <p className="text-gray-300 leading-relaxed text-lg mb-6">
              {t('visionMission.mission.description')}
            </p>
            
            {/* Mission Highlights */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">{t('visionMission.mission.highlights.0.title')}</h4>
                  <p className="text-gray-400 text-sm">{t('visionMission.mission.highlights.0.desc')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">{t('visionMission.mission.highlights.1.title')}</h4>
                  <p className="text-gray-400 text-sm">{t('visionMission.mission.highlights.1.desc')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">{t('visionMission.mission.highlights.2.title')}</h4>
                  <p className="text-gray-400 text-sm">{t('visionMission.mission.highlights.2.desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-yellow-400/10 to-blue-600/10 border border-yellow-400/30 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              {t('visionMission.cta.title')}
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              {t('visionMission.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/register"
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-8 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 inline-block"
              >
                {t('visionMission.cta.register')}
              </a>
              <a 
                href="/login"
                className="bg-slate-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-700 transition-all duration-200 transform hover:scale-105 inline-block border border-slate-600"
              >
                {t('visionMission.cta.login')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default VisionMission
