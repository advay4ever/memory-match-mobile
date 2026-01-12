import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription } from './components/ui/alert';
import { Volume2, Clock, Check, X, Play, Settings, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataManager, SessionData } from './components/DataManager';
import { LandingPage } from './components/LandingPage';

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
  const [showLanding, setShowLanding] = useState(true);
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [userRole, setUserRole] = useState<UserRole>('operator');
  const [targetSounds, setTargetSounds] = useState<Sound[]>([]);
  const [selectedSounds, setSelectedSounds] = useState<Set<number>>(new Set());
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [delayCountdown, setDelayCountdown] = useState(8); // 8 seconds delay
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

  // Preload dog bark audio
  const dogBarkAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/dog-bark-419014.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  // Preload car horn audio
  const carHornAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/car-horn-352443.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  // Preload bird chirping audio
  const birdChirpAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/bird-chirping-428659.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  // Preload bell ring audio
  const bellRingAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/bell-ring-199839.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  // Preload water droplet audio
  const waterDropAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/water-droplet-165637.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  const phoneRingAudio = useMemo(() => {
    const soundPath = `${import.meta.env.BASE_URL}sounds/phone-ringing-382734.mp3`;
    console.log('Phone ring sound path:', soundPath);
    const audio = new Audio(soundPath);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.onerror = (e) => console.error('Error loading phone ring audio:', e);
    return audio;
  }, []);

  const createDogBark = useCallback(() => {
    // Play the real dog bark MP3 file
    try {
      // Clone the audio to allow overlapping plays
      const audio = dogBarkAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing dog bark:', err));
    } catch (err) {
      console.error('Error creating dog bark audio:', err);
    }
  }, [dogBarkAudio]);

  const createBellRing = useCallback(() => {
    // Play the real bell ring MP3 file
    try {
      // Clone the audio to allow overlapping plays
      const audio = bellRingAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing bell ring:', err));
    } catch (err) {
      console.error('Error creating bell ring audio:', err);
    }
  }, [bellRingAudio]);

  const createWaterDrop = useCallback(() => {
    // Play the real water droplet MP3 file
    try {
      // Clone the audio to allow overlapping plays
      const audio = waterDropAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing water drop:', err));
    } catch (err) {
      console.error('Error creating water drop audio:', err);
    }
  }, [waterDropAudio]);

  const createBirdChirp = useCallback(() => {
    // Play the real bird chirping MP3 file
    try {
      // Clone the audio to allow overlapping plays
      const audio = birdChirpAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing bird chirp:', err));
    } catch (err) {
      console.error('Error creating bird chirp audio:', err);
    }
  }, [birdChirpAudio]);

  const createCarHorn = useCallback(() => {
    // Play the real car horn MP3 file
    try {
      // Clone the audio to allow overlapping plays
      const audio = carHornAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing car horn:', err));
    } catch (err) {
      console.error('Error creating car horn audio:', err);
    }
  }, [carHornAudio]);

  const createPhoneRing = useCallback(() => {
    // Play the real phone ring MP3 file
    try {
      // Clone the audio to allow overlapping plays
      const audio = phoneRingAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing phone ring:', err));
    } catch (err) {
      console.error('Error creating phone ring audio:', err);
    }
  }, [phoneRingAudio]);

  const playSound = useCallback((soundType: Sound['soundType']) => {
    if (!audioContext) return;

    switch (soundType) {
      case 'dog':
        createDogBark();
        break;
      case 'bell':
        createBellRing();
        break;
      case 'water':
        createWaterDrop();
        break;
      case 'bird':
        createBirdChirp();
        break;
      case 'horn':
        createCarHorn();
        break;
      case 'phone':
        createPhoneRing();
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
      setDelayCountdown(8); // Reset to 8 seconds
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

  const handleStartGame = () => {
    setShowLanding(false);
  };

  const correctIds = new Set(targetSounds.map(s => s.id));
  const isCorrect = selectedSounds.size === correctIds.size && 
                   [...selectedSounds].every(id => correctIds.has(id));

  const recentSessions = dataManager.current.getRecentSessions(5);

  // Show landing page first
  if (showLanding) {
    return <LandingPage onStart={handleStartGame} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white border-b-2 border-gray-200 shadow-sm relative">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Memory Match! 🎮</h1>
            <p className="text-sm text-gray-600 font-medium">
              {userRole === 'operator' ? '🎯 Operator View' : `🎪 Session ${sessionNumber}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {userRole === 'patient' && (
              <Badge variant="secondary" className="px-3 py-2 bg-blue-600 text-white border-0">
                <Clock className="w-3 h-3 mr-1" />
                {Math.round(reactionTime / 1000)}s
              </Badge>
            )}
          </div>
        </div>
        {userRole === 'operator' && (
          <Button 
            onClick={() => setShowLanding(true)}
            variant="outline"
            size="default"
            className="absolute top-4 right-4 border-2 border-gray-700 hover:border-blue-600 hover:bg-blue-50 text-gray-900 font-bold text-base px-4 py-2"
          >
            ← Home
          </Button>
        )}
      </div>

      {/* Alert Banner */}
      {showAlert && (
        <Alert className="mx-4 mt-4 border-2 border-amber-400 bg-amber-50 shadow-md">
          <AlertTriangle className="h-5 w-5 text-amber-700" />
          <AlertDescription className="text-amber-900 font-medium">
            📊 Performance alert: Consider consulting with healthcare provider.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {gamePhase === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-10 bg-white shadow-xl border-2 border-gray-200 rounded-3xl">
                  <h2 className="text-4xl mb-6 text-center font-bold text-gray-900">
                    🧠 Cognitive Assessment
                  </h2>
                  <p className="text-gray-700 mb-8 text-center font-medium text-xl">
                    Memory Match Test for Cognitive Health ✨
                  </p>
                  
                  {recentSessions.length > 0 && (
                    <div className="mb-8 p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base text-gray-800 font-bold">📈 Recent Sessions:</h3>
                      </div>
                      <div className="space-y-3">
                        {recentSessions.slice(-3).map((session, index) => (
                          <div key={session.id} className="flex justify-between text-base text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                            <span className="font-medium">🎯 Session {session.gameNumber}</span>
                            <span className={session.accuracy >= 60 ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
                              {session.accuracy.toFixed(0)}% • {(session.reactionTime / 1000).toFixed(1)}s
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-5">
                    <p className="text-lg text-gray-600 text-center font-medium">
                      👨‍⚕️ Operator: Start the test when patient is ready
                    </p>
                    <Button 
                      onClick={startGame}
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-7 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Play className="w-7 h-7 mr-2" />
                      🚀 Start Memory Test
                    </Button>
                    
                    {recentSessions.length > 0 && (
                      <Button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to clear all session data? This cannot be undone.')) {
                            dataManager.current.clearAllData();
                            setSessionNumber(1);
                            window.location.reload();
                          }
                        }}
                        variant="outline"
                        size="lg"
                        className="w-full border-2 border-red-400 text-red-600 hover:bg-red-50 hover:border-red-600 font-semibold"
                      >
                        🗑️ Clear All Sessions
                      </Button>
                    )}
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
                <Card className="p-8 bg-white shadow-xl border-2 border-green-300 rounded-3xl">
                  <h2 className="text-2xl mb-6 text-center font-bold text-gray-900">
                    📋 Instructions
                  </h2>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-lg text-white font-bold">1</span>
                      </div>
                      <p className="text-gray-800 font-medium">🎵 Listen to 3 different sounds</p>
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-lg text-white font-bold">2</span>
                      </div>
                      <p className="text-gray-800 font-medium">⏳ Wait for the selection screen</p>
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-lg text-white font-bold">3</span>
                      </div>
                      <p className="text-gray-800 font-medium">👆 Tap the 3 sounds you heard</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={startListening}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    <Volume2 className="w-6 h-6 mr-2" />
                    🎧 Ready to Listen!
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
                <Card className="p-8 bg-white shadow-xl border-2 border-blue-300 rounded-3xl">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-center mb-6"
                  >
                    <div className="w-20 h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <Volume2 className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>
                  
                  <h2 className="text-2xl mb-6 text-center font-bold text-blue-900">
                    🎵 Listen carefully...
                  </h2>
                  
                  <div className="flex justify-center space-x-4 mb-6">
                    {targetSounds.map((sound, index) => (
                      <motion.div
                        key={sound.id}
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl border-4 shadow-xl ${
                          index === currentSoundIndex 
                            ? 'bg-blue-600 border-blue-400 text-white' 
                            : index < currentSoundIndex 
                              ? 'bg-green-600 border-green-400 text-white' 
                              : 'bg-gray-100 border-gray-300 text-gray-400'
                        }`}
                        animate={index === currentSoundIndex ? { 
                          scale: [1, 1.3, 1],
                          rotate: [0, 10, -10, 0]
                        } : {}}
                        transition={{ duration: 0.8 }}
                      >
                        {sound.icon}
                      </motion.div>
                    ))}
                  </div>
                  
                  <p className="text-center text-gray-700 font-bold text-lg">
                    🔊 Sound {Math.min(currentSoundIndex + 1, 3)} of 3
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
                <Card className="p-8 bg-white shadow-xl text-center border-2 border-amber-300 rounded-3xl">
                  <h2 className="text-2xl mb-6 font-bold text-amber-900">
                    ⏰ Please wait...
                  </h2>
                  
                  <motion.div
                    key={delayCountdown}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-8xl mb-6 font-bold text-blue-900"
                  >
                    {delayCountdown}
                  </motion.div>
                  
                  <p className="text-gray-700 font-medium text-lg">🎯 Get ready to select the sounds!</p>
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
                <Card className="p-6 bg-white shadow-xl border-2 border-blue-300 rounded-3xl">
                  <h2 className="text-xl mb-2 text-center font-bold text-blue-900">
                    🎯 Which 3 sounds did you hear?
                  </h2>
                  <p className="text-sm text-gray-700 text-center mb-6 font-medium">
                    👆 Tap exactly 3 sounds • Selected: <span className="text-blue-600 font-bold">{selectedSounds.size}/3</span>
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {GAME_SOUNDS.map((sound) => (
                      <motion.button
                        key={sound.id}
                        onClick={() => handleSoundSelection(sound.id)}
                        disabled={!selectedSounds.has(sound.id) && selectedSounds.size >= 3}
                        className={`aspect-square rounded-3xl flex flex-col items-center justify-center p-4 border-4 transition-all shadow-lg ${
                          selectedSounds.has(sound.id)
                            ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-105'
                            : selectedSounds.size >= 3
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:shadow-xl'
                        }`}
                        whileTap={{ scale: 0.9 }}
                        whileHover={selectedSounds.has(sound.id) || selectedSounds.size < 3 ? { scale: 1.1 } : {}}
                      >
                        <span className="text-4xl mb-2">{sound.icon}</span>
                        <span className="text-xs text-center font-bold">{sound.name}</span>
                      </motion.button>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={submitAnswer}
                    disabled={selectedSounds.size !== 3}
                    className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    ✅ Submit Answer ({selectedSounds.size}/3)
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
                <Card className="p-8 bg-white shadow-xl text-center border-2 border-green-300 rounded-3xl">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    {isCorrect ? (
                      <div className="w-24 h-24 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-16 h-16 text-white" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <X className="w-16 h-16 text-white" />
                      </div>
                    )}
                  </motion.div>
                  
                  <h2 className="text-3xl mb-4 font-bold text-gray-900">
                    {isCorrect ? '🎉 Excellent!' : '💪 Good Try!'}
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-center items-center space-x-4">
                      <Badge variant={isCorrect ? "default" : "secondary"} className={`px-6 py-3 text-lg font-bold ${isCorrect ? 'bg-green-100 text-green-800 border-2 border-green-600' : 'bg-red-100 text-red-800 border-2 border-red-600'}`}>
                        {isCorrect ? '✨ 100%' : `📊 ${(calculatePartialAccuracy() * 100).toFixed(0)}%`} Accuracy
                      </Badge>
                      <Badge variant="outline" className="px-6 py-3 border-2 border-blue-400 text-blue-700 font-bold text-lg">
                        ⏱️ {(reactionTime / 1000).toFixed(1)}s
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-700 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <p className="mb-2 font-bold text-base">
                        ✅ Correct: <span className="text-2xl">{targetSounds.map(s => s.icon).join(' ')}</span>
                      </p>
                      <p className="text-gray-600 text-xs">
                        ({targetSounds.map(s => s.name).join(', ')})
                      </p>
                      {!isCorrect && (
                        <p className="text-gray-700 mt-3 font-medium">
                          Your selection: <span className="text-2xl">{[...selectedSounds].map(id => 
                            GAME_SOUNDS.find(s => s.id === id)?.icon
                          ).join(' ') || 'None'}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={resetToOperator}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    <Settings className="w-6 h-6 mr-2" />
                    🏠 Return to Operator
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