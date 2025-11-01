import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription } from './components/ui/alert';
import { Volume2, Clock, Check, X, RotateCcw, Play, Settings, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataManager, SessionData } from './components/DataManager';

type GamePhase = 'setup' | 'instructions' | 'listen' | 'delay' | 'selection' | 'feedback' | 'results';
type UserRole = 'operator' | 'patient';

interface Sound {
  id: number;
  name: string;
  icon: string;
  description: string;
  soundType: 'dog' | 'bell' | 'water' | 'bird' | 'horn' | 'phone';
}

// Exactly as specified in requirements: realistic sounds with clear icons
const GAME_SOUNDS: Sound[] = [
  { id: 1, name: 'Dog Bark', icon: '🐕', description: 'Woof woof', soundType: 'dog' },
  { id: 2, name: 'Bell Ring', icon: '🔔', description: 'Ding dong', soundType: 'bell' },
  { id: 3, name: 'Water Drop', icon: '💧', description: 'Drip drop', soundType: 'water' },
  { id: 4, name: 'Bird Chirp', icon: '🐦', description: 'Tweet tweet', soundType: 'bird' },
  { id: 5, name: 'Car Horn', icon: '🚗', description: 'Beep beep', soundType: 'horn' },
  { id: 6, name: 'Phone Ring', icon: '📞', description: 'Ring ring', soundType: 'phone' },
];

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [userRole, setUserRole] = useState<UserRole>('operator');
  const [targetSounds, setTargetSounds] = useState<Sound[]>([]);
  const [selectedSounds, setSelectedSounds] = useState<Set<number>>(new Set());
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [delayCountdown, setDelayCountdown] = useState(6); // 6 seconds delay
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [selectionStartTime, setSelectionStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number>(0);
  const [showAlert, setShowAlert] = useState(false);
  
  const dataManager = useRef(DataManager.getInstance());

  // Initialize audio context
  useEffect(() => {
    const initAudio = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
      } catch (error) {
        console.warn('Audio not supported');
      }
    };
    initAudio();
  }, []);

  const createDogBark = useCallback((ctx: AudioContext, startTime: number) => {
    // Dog bark: Low growl + sharp bark
    const duration = 0.6;
    
    // Low growl component
    const growlOsc = ctx.createOscillator();
    const growlGain = ctx.createGain();
    const growlFilter = ctx.createBiquadFilter();
    
    growlOsc.type = 'sawtooth';
    growlOsc.frequency.setValueAtTime(80, startTime);
    growlOsc.frequency.exponentialRampToValueAtTime(120, startTime + 0.2);
    
    growlFilter.type = 'lowpass';
    growlFilter.frequency.setValueAtTime(400, startTime);
    
    growlGain.gain.setValueAtTime(0.3, startTime);
    growlGain.gain.exponentialRampToValueAtTime(0.1, startTime + 0.3);
    growlGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    growlOsc.connect(growlFilter).connect(growlGain).connect(ctx.destination);
    
    // Sharp bark component
    const barkOsc = ctx.createOscillator();
    const barkGain = ctx.createGain();
    
    barkOsc.type = 'square';
    barkOsc.frequency.setValueAtTime(200, startTime + 0.3);
    barkOsc.frequency.exponentialRampToValueAtTime(300, startTime + 0.35);
    barkOsc.frequency.exponentialRampToValueAtTime(150, startTime + 0.5);
    
    barkGain.gain.setValueAtTime(0, startTime + 0.3);
    barkGain.gain.linearRampToValueAtTime(0.4, startTime + 0.32);
    barkGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    barkOsc.connect(barkGain).connect(ctx.destination);
    
    growlOsc.start(startTime);
    growlOsc.stop(startTime + duration);
    barkOsc.start(startTime + 0.3);
    barkOsc.stop(startTime + duration);
  }, []);

  const createBellRing = useCallback((ctx: AudioContext, startTime: number) => {
    // Bell: Harmonic frequencies with decay
    const duration = 1.2;
    const fundamentalFreq = 523; // C5
    const harmonics = [1, 2, 3, 4, 5];
    
    harmonics.forEach((harmonic, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamentalFreq * harmonic, startTime);
      
      const amplitude = 0.3 / (harmonic * harmonic); // Decay amplitude with harmonics
      gain.gain.setValueAtTime(amplitude, startTime);
      gain.gain.exponentialRampToValueAtTime(amplitude * 0.1, startTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }, []);

  const createWaterDrop = useCallback((ctx: AudioContext, startTime: number) => {
    // Water drop: Filtered noise burst + resonant tone
    const duration = 0.4;
    
    // Create noise
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, startTime);
    noiseFilter.Q.setValueAtTime(10, startTime);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
    
    // Resonant tone
    const tone = ctx.createOscillator();
    const toneGain = ctx.createGain();
    
    tone.type = 'sine';
    tone.frequency.setValueAtTime(400, startTime);
    tone.frequency.exponentialRampToValueAtTime(200, startTime + duration);
    
    toneGain.gain.setValueAtTime(0.3, startTime + 0.05);
    toneGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    tone.connect(toneGain).connect(ctx.destination);
    
    noise.start(startTime);
    tone.start(startTime + 0.05);
    tone.stop(startTime + duration);
  }, []);

  const createBirdChirp = useCallback((ctx: AudioContext, startTime: number) => {
    // Bird chirp: Modulated high frequency
    const duration = 0.5;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    
    // Main oscillator
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, startTime);
    osc.frequency.exponentialRampToValueAtTime(3000, startTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(2500, startTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(1800, startTime + duration);
    
    // Frequency modulation for trill effect
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(15, startTime);
    modGain.gain.setValueAtTime(100, startTime);
    
    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    modulator.connect(modGain).connect(osc.frequency);
    osc.connect(gain).connect(ctx.destination);
    
    modulator.start(startTime);
    osc.start(startTime);
    modulator.stop(startTime + duration);
    osc.stop(startTime + duration);
  }, []);

  const createCarHorn = useCallback((ctx: AudioContext, startTime: number) => {
    // Car horn: Dual tone beep
    const duration = 0.7;
    
    // Lower tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(220, startTime);
    
    gain1.gain.setValueAtTime(0.2, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    // Higher tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(330, startTime);
    
    gain2.gain.setValueAtTime(0.2, startTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc1.connect(gain1).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);
    
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }, []);

  const createPhoneRing = useCallback((ctx: AudioContext, startTime: number) => {
    // Phone ring: Classic ring pattern
    const ringDuration = 0.3;
    const pauseDuration = 0.2;
    const totalDuration = 1.0;
    
    for (let i = 0; i < 2; i++) {
      const ringStart = startTime + i * (ringDuration + pauseDuration);
      
      // Two-tone ring
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, ringStart);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, ringStart);
      
      gain1.gain.setValueAtTime(0.15, ringStart);
      gain1.gain.exponentialRampToValueAtTime(0.001, ringStart + ringDuration);
      gain2.gain.setValueAtTime(0.15, ringStart);
      gain2.gain.exponentialRampToValueAtTime(0.001, ringStart + ringDuration);
      
      osc1.connect(gain1).connect(ctx.destination);
      osc2.connect(gain2).connect(ctx.destination);
      
      osc1.start(ringStart);
      osc2.start(ringStart);
      osc1.stop(ringStart + ringDuration);
      osc2.stop(ringStart + ringDuration);
    }
  }, []);

  const playSound = useCallback((soundType: Sound['soundType']) => {
    if (!audioContext) return;

    const startTime = audioContext.currentTime + 0.1;

    switch (soundType) {
      case 'dog':
        createDogBark(audioContext, startTime);
        break;
      case 'bell':
        createBellRing(audioContext, startTime);
        break;
      case 'water':
        createWaterDrop(audioContext, startTime);
        break;
      case 'bird':
        createBirdChirp(audioContext, startTime);
        break;
      case 'horn':
        createCarHorn(audioContext, startTime);
        break;
      case 'phone':
        createPhoneRing(audioContext, startTime);
        break;
    }
  }, [audioContext, createDogBark, createBellRing, createWaterDrop, createBirdChirp, createCarHorn, createPhoneRing]);

  const startGame = () => {
    // Always select exactly 3 sounds as per requirements
    const shuffled = [...GAME_SOUNDS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    
    setTargetSounds(selected);
    setSelectedSounds(new Set());
    setCurrentSoundIndex(0);
    setGameStartTime(Date.now());
    setUserRole('patient');
    setGamePhase('instructions');
  };

  const startListening = () => {
    setGamePhase('listen');
  };

  const playSequence = useCallback(async () => {
    if (gamePhase !== 'listen' || currentSoundIndex >= targetSounds.length) {
      setGamePhase('delay');
      setDelayCountdown(6); // Reset to 6 seconds
      return;
    }

    const sound = targetSounds[currentSoundIndex];
    playSound(sound.soundType);
    
    setTimeout(() => {
      setCurrentSoundIndex(prev => prev + 1);
    }, 1500); // 1.5 seconds between sounds
  }, [gamePhase, currentSoundIndex, targetSounds, playSound]);

  useEffect(() => {
    if (gamePhase === 'listen') {
      const timer = setTimeout(playSequence, 800);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, playSequence]);

  // Delay countdown (5-7 seconds as per requirements)
  useEffect(() => {
    if (gamePhase === 'delay' && delayCountdown > 0) {
      const timer = setTimeout(() => {
        setDelayCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gamePhase === 'delay' && delayCountdown === 0) {
      setGamePhase('selection');
      setSelectionStartTime(Date.now());
    }
  }, [gamePhase, delayCountdown]);

  const handleSoundSelection = (soundId: number) => {
    const newSelection = new Set(selectedSounds);
    if (newSelection.has(soundId)) {
      newSelection.delete(soundId);
    } else if (newSelection.size < 3) { // Limit to 3 selections
      newSelection.add(soundId);
    }
    setSelectedSounds(newSelection);
  };

  const submitAnswer = () => {
    const endTime = Date.now();
    const calculatedReactionTime = endTime - selectionStartTime;
    setReactionTime(calculatedReactionTime);
    
    const correctIds = new Set(targetSounds.map(s => s.id));
    const isCorrect = selectedSounds.size === correctIds.size && 
                     [...selectedSounds].every(id => correctIds.has(id));
    
    const accuracy = isCorrect ? 100 : (calculatePartialAccuracy() * 100);
    
    // Save session data
    const sessionData: SessionData = {
      id: `session_${Date.now()}`,
      timestamp: new Date(),
      accuracy: accuracy,
      reactionTime: calculatedReactionTime,
      correctSounds: targetSounds.map(s => s.name),
      selectedSounds: [...selectedSounds].map(id => 
        GAME_SOUNDS.find(s => s.id === id)?.name || 'Unknown'
      ),
      gameNumber: sessionNumber,
      isCorrect: isCorrect
    };
    
    dataManager.current.saveSession(sessionData);
    
    // Check for alerts
    const needsAlert = dataManager.current.checkAlertConditions();
    setShowAlert(needsAlert);
    
    setGamePhase('feedback');
  };

  const calculatePartialAccuracy = (): number => {
    const correctIds = new Set(targetSounds.map(s => s.id));
    const correctSelections = [...selectedSounds].filter(id => correctIds.has(id)).length;
    const totalPossible = Math.max(correctIds.size, selectedSounds.size);
    return totalPossible === 0 ? 0 : correctSelections / totalPossible;
  };

  const resetToOperator = () => {
    setGamePhase('setup');
    setUserRole('operator');
    setSessionNumber(prev => prev + 1);
    setTargetSounds([]);
    setSelectedSounds(new Set());
    setCurrentSoundIndex(0);
    setShowAlert(false);
  };

  const correctIds = new Set(targetSounds.map(s => s.id));
  const isCorrect = selectedSounds.size === correctIds.size && 
                   [...selectedSounds].every(id => correctIds.has(id));

  const recentSessions = dataManager.current.getRecentSessions(5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <h1 className="text-lg text-gray-800">Memory Assessment</h1>
            <p className="text-sm text-gray-600">
              {userRole === 'operator' ? 'Operator View' : `Session ${sessionNumber}`}
            </p>
          </div>
          {userRole === 'patient' && (
            <Badge variant="secondary" className="px-3 py-1">
              <Clock className="w-3 h-3 mr-1" />
              {Math.round(reactionTime / 1000)}s
            </Badge>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      {showAlert && (
        <Alert className="mx-4 mt-4 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Performance alert: Consider consulting with healthcare provider.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {gamePhase === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-lg">
                  <h2 className="text-2xl mb-4 text-center text-gray-800">
                    Cognitive Assessment
                  </h2>
                  <p className="text-gray-600 mb-6 text-center">
                    Memory Match Test for Cognitive Health
                  </p>
                  
                  {recentSessions.length > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm mb-2 text-gray-700">Recent Sessions:</h3>
                      <div className="space-y-1">
                        {recentSessions.slice(-3).map((session, index) => (
                          <div key={session.id} className="flex justify-between text-xs text-gray-600">
                            <span>Session {recentSessions.length - index}</span>
                            <span className={session.accuracy >= 60 ? 'text-green-600' : 'text-red-600'}>
                              {session.accuracy.toFixed(0)}% • {(session.reactionTime / 1000).toFixed(1)}s
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 text-center">
                      Operator: Start the test when patient is ready
                    </p>
                    <Button 
                      onClick={startGame}
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Memory Test
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {gamePhase === 'instructions' && (
              <motion.div
                key="instructions"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-lg">
                  <h2 className="text-xl mb-6 text-center text-gray-800">Instructions</h2>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm text-blue-600">1</span>
                      </div>
                      <p className="text-gray-700">Listen to 3 different sounds</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm text-blue-600">2</span>
                      </div>
                      <p className="text-gray-700">Wait for the selection screen</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm text-blue-600">3</span>
                      </div>
                      <p className="text-gray-700">Tap the 3 sounds you heard</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={startListening}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Volume2 className="w-5 h-5 mr-2" />
                    Ready to Listen
                  </Button>
                </Card>
              </motion.div>
            )}

            {gamePhase === 'listen' && (
              <motion.div
                key="listen"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-lg">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-center mb-6"
                  >
                    <Volume2 className="w-16 h-16 mx-auto text-blue-600" />
                  </motion.div>
                  
                  <h2 className="text-xl mb-6 text-center text-gray-800">
                    Listen carefully...
                  </h2>
                  
                  <div className="flex justify-center space-x-4 mb-6">
                    {targetSounds.map((sound, index) => (
                      <motion.div
                        key={sound.id}
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-4 ${
                          index === currentSoundIndex 
                            ? 'bg-blue-500 border-blue-400 text-white shadow-lg' 
                            : index < currentSoundIndex 
                              ? 'bg-green-500 border-green-400 text-white' 
                              : 'bg-gray-100 border-gray-300 text-gray-400'
                        }`}
                        animate={index === currentSoundIndex ? { 
                          scale: [1, 1.3, 1],
                          rotate: [0, 5, -5, 0]
                        } : {}}
                        transition={{ duration: 0.8 }}
                      >
                        {sound.icon}
                      </motion.div>
                    ))}
                  </div>
                  
                  <p className="text-center text-gray-600">
                    Sound {Math.min(currentSoundIndex + 1, 3)} of 3
                  </p>
                </Card>
              </motion.div>
            )}

            {gamePhase === 'delay' && (
              <motion.div
                key="delay"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-lg text-center">
                  <h2 className="text-xl mb-6 text-gray-800">Please wait...</h2>
                  
                  <motion.div
                    key={delayCountdown}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl mb-6 text-blue-600"
                  >
                    {delayCountdown}
                  </motion.div>
                  
                  <p className="text-gray-600">Get ready to select the sounds</p>
                </Card>
              </motion.div>
            )}

            {gamePhase === 'selection' && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-6 bg-white/95 backdrop-blur-sm shadow-lg">
                  <h2 className="text-lg mb-2 text-center text-gray-800">
                    Which 3 sounds did you hear?
                  </h2>
                  <p className="text-sm text-gray-600 text-center mb-6">
                    Tap exactly 3 sounds • Selected: {selectedSounds.size}/3
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {GAME_SOUNDS.map((sound) => (
                      <motion.button
                        key={sound.id}
                        onClick={() => handleSoundSelection(sound.id)}
                        disabled={!selectedSounds.has(sound.id) && selectedSounds.size >= 3}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-4 border-3 transition-all ${
                          selectedSounds.has(sound.id)
                            ? 'bg-blue-500 border-blue-400 text-white shadow-lg'
                            : selectedSounds.size >= 3
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                        whileTap={{ scale: 0.95 }}
                        whileHover={selectedSounds.has(sound.id) || selectedSounds.size < 3 ? { scale: 1.05 } : {}}
                      >
                        <span className="text-3xl mb-2">{sound.icon}</span>
                        <span className="text-xs text-center">{sound.name}</span>
                      </motion.button>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={submitAnswer}
                    disabled={selectedSounds.size !== 3}
                    className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300"
                    size="lg"
                  >
                    Submit Answer ({selectedSounds.size}/3)
                  </Button>
                </Card>
              </motion.div>
            )}

            {gamePhase === 'feedback' && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-lg text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    {isCorrect ? (
                      <Check className="w-20 h-20 mx-auto mb-4 text-green-600" />
                    ) : (
                      <X className="w-20 h-20 mx-auto mb-4 text-red-500" />
                    )}
                  </motion.div>
                  
                  <h2 className="text-2xl mb-4 text-gray-800">
                    {isCorrect ? 'Excellent!' : 'Good Try!'}
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-center items-center space-x-4">
                      <Badge variant={isCorrect ? "default" : "secondary"} className="px-4 py-2">
                        {isCorrect ? '100%' : `${(calculatePartialAccuracy() * 100).toFixed(0)}%`} Accuracy
                      </Badge>
                      <Badge variant="outline" className="px-4 py-2">
                        {(reactionTime / 1000).toFixed(1)}s Response
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">
                        Correct: {targetSounds.map(s => s.icon).join(' ')} 
                        ({targetSounds.map(s => s.name).join(', ')})
                      </p>
                      {!isCorrect && (
                        <p className="text-gray-500">
                          Your selection: {[...selectedSounds].map(id => 
                            GAME_SOUNDS.find(s => s.id === id)?.icon
                          ).join(' ') || 'None'}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={resetToOperator}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    Return to Operator
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}