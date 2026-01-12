import { Button } from './ui/button';
import { Card } from './ui/card';
import { Volume2, Brain, Timer, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';
import { AboutModal } from './AboutModal';
import { useState } from 'react';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const { t } = useTranslation();
  const [showAbout, setShowAbout] = useState(false);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      {/* About Link - Top Left */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
        <button
          onClick={() => setShowAbout(true)}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm md:text-lg underline decoration-2 underline-offset-4 transition-colors"
          aria-label="About this project"
        >
          About
        </button>
      </div>

      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
        <LanguageSelector />
      </div>

      {/* About Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl mt-32 sm:mt-36 md:mt-0"
      >
        <Card className="p-6 md:p-12 bg-white/95 backdrop-blur-sm shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10">
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Volume2 className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3">
              {t('landing.title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
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
            <div className="flex flex-col items-center text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <Brain className="w-8 h-8 text-blue-700 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">{t('landing.feature1Title')}</h3>
              <p className="text-sm text-gray-600">{t('landing.feature1Desc')}</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
              <Timer className="w-8 h-8 text-green-700 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">{t('landing.feature2Title')}</h3>
              <p className="text-sm text-gray-600">{t('landing.feature2Desc')}</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <TrendingUp className="w-8 h-8 text-blue-700 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">{t('landing.feature3Title')}</h3>
              <p className="text-sm text-gray-600">{t('landing.feature3Desc')}</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mb-8 p-5 bg-amber-50 border-2 border-amber-300 rounded-lg">
            <p className="text-base text-amber-900 text-center">
              <strong>{t('landing.disclaimer').split('.')[0]}.</strong> {t('landing.disclaimer').split('.')[1]}.
            </p>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <Button
              onClick={onStart}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-12 py-7 text-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {t('landing.startButton')}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
