import { Button } from './ui/button';
import { Card } from './ui/card';
import { Volume2, Brain, Timer, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-500 to-pink-500">
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
              Memory Match Mobile
            </h1>
            <p className="text-xl text-gray-600">
              Cognitive Assessment Game
            </p>
          </div>

          {/* Description */}
          <div className="mb-10 space-y-4">
            <p className="text-gray-700 leading-relaxed text-lg">
              Memory Match Mobile is a cognitive memory game that tests auditory memory and recall. The app plays a sequence of three different sounds, then challenges users to identify which sounds they heard after a brief delay.
            </p>
            <p className="text-gray-700 leading-relaxed text-lg">
              Designed to support memory training and cognitive engagement, the app tracks performance over time and stores all data locally in the browser for privacy.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="flex flex-col items-center text-center p-6 bg-purple-50 rounded-lg">
              <Brain className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Memory Testing</h3>
              <p className="text-sm text-gray-600">Auditory recall assessment</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-pink-50 rounded-lg">
              <Timer className="w-8 h-8 text-pink-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Quick Sessions</h3>
              <p className="text-sm text-gray-600">Complete in under 2 minutes</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Track Progress</h3>
              <p className="text-sm text-gray-600">Monitor performance over time</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mb-8 p-5 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-base text-orange-800 text-center">
              <strong>Note:</strong> This is a screening tool, not a medical diagnostic device. 
              Consult healthcare professionals for any concerns.
            </p>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <Button
              onClick={onStart}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-7 text-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Start Assessment
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
