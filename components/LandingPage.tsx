import { Button } from './ui/button';
import { Card } from './ui/card';
import { Volume2, Brain, Timer, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-500 to-pink-500">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl"
      >
        <Card className="p-12 bg-white/95 backdrop-blur-sm shadow-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Volume2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-3">
              {t('landing.title')}
            </h1>
            <p className="text-xl text-gray-600">
              {t('landing.subtitle')}
            </p>
          </div>

          {/* Description */}
          <div className="mb-10 space-y-4">
            <p className="text-gray-700 leading-relaxed text-lg">
              {t('landing.description1')}
            </p>
            <p className="text-gray-700 leading-relaxed text-lg">
              {t('landing.description2')}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="flex flex-col items-center text-center p-6 bg-purple-50 rounded-lg">
              <Brain className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">{t('landing.feature1Title')}</h3>
              <p className="text-sm text-gray-600">{t('landing.feature1Desc')}</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-pink-50 rounded-lg">
              <Timer className="w-8 h-8 text-pink-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">{t('landing.feature2Title')}</h3>
              <p className="text-sm text-gray-600">{t('landing.feature2Desc')}</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">{t('landing.feature3Title')}</h3>
              <p className="text-sm text-gray-600">{t('landing.feature3Desc')}</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mb-8 p-5 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-base text-orange-800 text-center">
              <strong>{t('landing.disclaimer').split('.')[0]}.</strong> {t('landing.disclaimer').split('.')[1]}.
            </p>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <Button
              onClick={onStart}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-7 text-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {t('landing.startButton')}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
