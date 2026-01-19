import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription } from './components/ui/alert';
import { Volume2, Clock, Check, X, Play, Settings, AlertTriangle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataManager, SessionData } from './components/DataManager';
import { LandingPage } from './components/LandingPage';
import { useTranslation } from 'react-i18next';

type GamePhase = 'setup' | 'instructions' | 'listen' | 'delay' | 'selection' | 'feedback' | 'results';
type UserRole = 'operator' | 'patient';

interface Sound {
  id: number;
  name: string;
  icon: string;
  description: string;
  soundType: 'dog' | 'bell' | 'water' | 'bird' | 'horn' | 'phone' | 'cat' | 'thunder' | 'cow' | 'clock' | 'door' | 'clap' | 'baby' | 'fire' | 'rooster';
}

export default function App() {
  const { t, i18n } = useTranslation();
  
  // Define sounds with useMemo so they update when language changes
  const GAME_SOUNDS: Sound[] = useMemo(() => [
    { id: 1, name: t('game.sounds.dogBark'), icon: '🐕', description: 'Woof woof', soundType: 'dog' },
    { id: 2, name: t('game.sounds.bellRing'), icon: '🔔', description: 'Ding dong', soundType: 'bell' },
    { id: 3, name: t('game.sounds.waterDrop'), icon: '💧', description: 'Drip drop', soundType: 'water' },
    { id: 4, name: t('game.sounds.birdChirp'), icon: '🐦', description: 'Tweet tweet', soundType: 'bird' },
    { id: 5, name: t('game.sounds.carHorn'), icon: '🚗', description: 'Beep beep', soundType: 'horn' },
    { id: 6, name: t('game.sounds.phoneRing'), icon: '📞', description: 'Ring ring', soundType: 'phone' },
    { id: 7, name: t('game.sounds.catMeow'), icon: '🐱', description: 'Meow meow', soundType: 'cat' },
    { id: 8, name: t('game.sounds.thunder'), icon: '⛈️', description: 'Rumble', soundType: 'thunder' },
    { id: 9, name: t('game.sounds.cowMoo'), icon: '🐄', description: 'Moo moo', soundType: 'cow' },
    { id: 10, name: t('game.sounds.clockTick'), icon: '🕐', description: 'Tick tock', soundType: 'clock' },
    { id: 11, name: t('game.sounds.doorKnock'), icon: '🚪', description: 'Knock knock', soundType: 'door' },
    { id: 12, name: t('game.sounds.clapping'), icon: '👏', description: 'Clap clap', soundType: 'clap' },
    { id: 13, name: t('game.sounds.babyCry'), icon: '👶', description: 'Wah wah', soundType: 'baby' },
    { id: 14, name: t('game.sounds.fireCrackling'), icon: '🔥', description: 'Crackle', soundType: 'fire' },
    { id: 15, name: t('game.sounds.rooster'), icon: '🐓', description: 'Cock-a-doodle', soundType: 'rooster' },
  ], [t, i18n.language]);
  
  const [showLanding, setShowLanding] = useState(true);
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [userRole, setUserRole] = useState<UserRole>('operator');
  const [targetSounds, setTargetSounds] = useState<Sound[]>([]);
  const [displaySounds, setDisplaySounds] = useState<Sound[]>([]); // 6 sounds shown during selection (3 correct + 3 distractors)
  const [selectedSounds, setSelectedSounds] = useState<Set<number>>(new Set());
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [delayCountdown, setDelayCountdown] = useState(8); // 8 seconds delay
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [selectionStartTime, setSelectionStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number>(0);
  const [showAlert, setShowAlert] = useState(false);
  const [showLangSelector, setShowLangSelector] = useState(false);
  
  const dataManager = useRef(DataManager.getInstance());
  
  // Initialize session number from stored data (next session = stored count + 1)
  const [sessionNumber, setSessionNumber] = useState(() => {
    const storedSessions = DataManager.getInstance().getAllSessions();
    return storedSessions.length + 1;
  });

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];


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

  // Close language selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showLangSelector && !target.closest('.lang-selector-container')) {
        setShowLangSelector(false);
      }
    };

    if (showLangSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLangSelector]);

  // Update target sounds and display sounds when language changes (if game is in progress)
  useEffect(() => {
    if (targetSounds.length > 0) {
      // Map the current target sounds to their new translated versions
      const updatedTargets = targetSounds.map(oldSound => {
        const newSound = GAME_SOUNDS.find(s => s.id === oldSound.id);
        return newSound || oldSound;
      });
      setTargetSounds(updatedTargets);
    }
    if (displaySounds.length > 0) {
      // Map the current display sounds to their new translated versions
      const updatedDisplay = displaySounds.map(oldSound => {
        const newSound = GAME_SOUNDS.find(s => s.id === oldSound.id);
        return newSound || oldSound;
      });
      setDisplaySounds(updatedDisplay);
    }
  }, [i18n.language, GAME_SOUNDS]);

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
    const soundPath = `${import.meta.env.BASE_URL}sounds/phone-ringing-382734.mp3?v=2`;
    console.log('Phone ring sound path:', soundPath);
    const audio = new Audio(soundPath);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.onerror = (e) => console.error('Error loading phone ring audio:', e);
    return audio;
  }, []);

  // Preload cat meow audio
  const catMeowAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/cat-meow-401729.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  // Preload thunder audio
  const thunderAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/loud-thunder-192165-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  // Preload cow moo audio
  const cowMooAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/cow-mooing-343423.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  // Preload clock tick audio
  const clockTickAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/clock-ticking-down-376897 (1)-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  // Preload door knock audio
  const doorKnockAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/knocking-on-door-6022-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  // Preload clapping audio
  const clappingAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/hand-clap-106596-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  // Preload baby cry audio
  const babyCryAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/baby-crying-463213-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  // Preload fire crackling audio
  const fireCracklingAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/free-fire-crackling-427409-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    return audio;
  }, []);

  // Preload rooster audio
  const roosterAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/rooster-crowing-364473.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
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

  const createCatMeow = useCallback(() => {
    try {
      const audio = catMeowAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing cat meow:', err));
    } catch (err) {
      console.error('Error creating cat meow audio:', err);
    }
  }, [catMeowAudio]);

  const createThunder = useCallback(() => {
    try {
      const audio = thunderAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing thunder:', err));
    } catch (err) {
      console.error('Error creating thunder audio:', err);
    }
  }, [thunderAudio]);

  const createCowMoo = useCallback(() => {
    try {
      const audio = cowMooAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing cow moo:', err));
    } catch (err) {
      console.error('Error creating cow moo audio:', err);
    }
  }, [cowMooAudio]);

  const createClockTick = useCallback(() => {
    try {
      const audio = clockTickAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing clock tick:', err));
    } catch (err) {
      console.error('Error creating clock tick audio:', err);
    }
  }, [clockTickAudio]);

  const createDoorKnock = useCallback(() => {
    try {
      const audio = doorKnockAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing door knock:', err));
    } catch (err) {
      console.error('Error creating door knock audio:', err);
    }
  }, [doorKnockAudio]);

  const createClapping = useCallback(() => {
    try {
      const audio = clappingAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing clapping:', err));
    } catch (err) {
      console.error('Error creating clapping audio:', err);
    }
  }, [clappingAudio]);

  const createBabyCry = useCallback(() => {
    try {
      const audio = babyCryAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing baby cry:', err));
    } catch (err) {
      console.error('Error creating baby cry audio:', err);
    }
  }, [babyCryAudio]);

  const createFireCrackling = useCallback(() => {
    try {
      const audio = fireCracklingAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing fire crackling:', err));
    } catch (err) {
      console.error('Error creating fire crackling audio:', err);
    }
  }, [fireCracklingAudio]);

  const createRooster = useCallback(() => {
    try {
      const audio = roosterAudio.cloneNode(true) as HTMLAudioElement;
      audio.play().catch(err => console.error('Error playing rooster:', err));
    } catch (err) {
      console.error('Error creating rooster audio:', err);
    }
  }, [roosterAudio]);

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
      case 'cat':
        createCatMeow();
        break;
      case 'thunder':
        createThunder();
        break;
      case 'cow':
        createCowMoo();
        break;
      case 'clock':
        createClockTick();
        break;
      case 'door':
        createDoorKnock();
        break;
      case 'clap':
        createClapping();
        break;
      case 'baby':
        createBabyCry();
        break;
      case 'fire':
        createFireCrackling();
        break;
      case 'rooster':
        createRooster();
        break;
    }
  }, [audioContext, createDogBark, createBellRing, createWaterDrop, createBirdChirp, createCarHorn, createPhoneRing, createCatMeow, createThunder, createCowMoo, createClockTick, createDoorKnock, createClapping, createBabyCry, createFireCrackling, createRooster]);

  const startGame = () => {
    // Always select exactly 3 sounds as per requirements
    const shuffled = [...GAME_SOUNDS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    
    // Get 3 distractor sounds (sounds not in selected)
    const selectedIds = new Set(selected.map(s => s.id));
    const distractors = GAME_SOUNDS.filter(s => !selectedIds.has(s.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    // Combine and shuffle for display (3 correct + 3 distractors = 6 total)
    const allDisplaySounds = [...selected, ...distractors].sort(() => Math.random() - 0.5);
    
    setTargetSounds(selected);
    setDisplaySounds(allDisplaySounds);
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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{t('game.title')} 🎮</h1>
            <p className="text-sm text-gray-600 font-medium">
              {userRole === 'operator' ? `🎯 ${t('game.operatorView')}` : t('game.sessionNumber', { number: sessionNumber })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Selector Button */}
            <div className="relative lang-selector-container">
              <Button
                onClick={() => setShowLangSelector(!showLangSelector)}
                variant="outline"
                size="sm"
                className="border-2 border-gray-300 hover:border-blue-500 px-2 py-1"
              >
                <Globe className="w-4 h-4 mr-1" />
                {currentLang.flag}
              </Button>
              
              {showLangSelector && (
                <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        setShowLangSelector(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2 ${
                        lang.code === i18n.language ? 'bg-blue-100 font-bold' : ''
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="text-sm">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
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
            ← {t('common.home')}
          </Button>
        )}
      </div>

      {/* Alert Banner */}
      {showAlert && (
        <Alert className="mx-4 mt-4 border-2 border-amber-400 bg-amber-50 shadow-md">
          <AlertTriangle className="h-5 w-5 text-amber-700" />
          <AlertDescription className="text-amber-900 font-medium">
            📊 {t('game.alertMessage')}
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
                    🧠 {t('game.setupTitle')}
                  </h2>
                  <p className="text-gray-700 mb-8 text-center font-medium text-xl">
                    {t('game.setupSubtitle')} ✨
                  </p>
                  
                  {recentSessions.length > 0 && (
                    <div className="mb-8 p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base text-gray-800 font-bold">📈 {t('game.recentSessions')}</h3>
                      </div>
                      <div className="space-y-3">
                        {recentSessions.slice(-3).map((session, index) => (
                          <div key={session.id} className="flex justify-between text-base text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                            <span className="font-medium">🎯 {t('game.session')} {session.gameNumber}</span>
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
                      👨‍⚕️ {t('game.operatorInstruction')}
                    </p>
                    <Button 
                      onClick={startGame}
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-7 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Play className="w-7 h-7 mr-2" />
                      🚀 {t('game.startTest')}
                    </Button>
                    
                    {recentSessions.length > 0 && (
                      <Button
                        onClick={() => {
                          if (window.confirm(t('game.clearConfirm'))) {
                            dataManager.current.clearAllData();
                            setSessionNumber(1);
                            window.location.reload();
                          }
                        }}
                        variant="outline"
                        size="lg"
                        className="w-full border-2 border-red-400 text-red-600 hover:bg-red-50 hover:border-red-600 font-semibold"
                      >
                        🗑️ {t('game.clearAllSessions')}
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
                    📋 {t('game.instructionsTitle')}
                  </h2>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-lg text-white font-bold">1</span>
                      </div>
                      <p className="text-gray-800 font-medium">🎵 {t('game.instruction1')}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-lg text-white font-bold">2</span>
                      </div>
                      <p className="text-gray-800 font-medium">⏳ {t('game.instruction2')}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-lg text-white font-bold">3</span>
                      </div>
                      <p className="text-gray-800 font-medium">👆 {t('game.instruction3')}</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={startListening}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    <Volume2 className="w-6 h-6 mr-2" />
                    🎧 {t('game.readyButton')}
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
                    🎵 {t('game.listenTitle')}
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
                    🔊 {t('game.soundOf', { current: Math.min(currentSoundIndex + 1, 3), total: 3 })}
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
                    ⏰ {t('game.delayTitle')}
                  </h2>
                  
                  <motion.div
                    key={delayCountdown}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-8xl mb-6 font-bold text-blue-900"
                  >
                    {delayCountdown}
                  </motion.div>
                  
                  <p className="text-gray-700 font-medium text-lg">🎯 {t('game.delayMessage')}</p>
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
                    🎯 {t('game.selectionTitle')}
                  </h2>
                  <p className="text-sm text-gray-700 text-center mb-6 font-medium">
                    {t('game.selectionInstruction', { count: selectedSounds.size })}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {displaySounds.map((sound) => (
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
                    ✅ {t('game.submitButton', { count: selectedSounds.size })}
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
                    {isCorrect ? `🎉 ${t('game.excellent')}` : `💪 ${t('game.goodTry')}`}
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-center items-center space-x-4">
                      <Badge variant={isCorrect ? "default" : "secondary"} className={`px-6 py-3 text-lg font-bold ${isCorrect ? 'bg-green-100 text-green-800 border-2 border-green-600' : 'bg-red-100 text-red-800 border-2 border-red-600'}`}>
                        {isCorrect ? '✨ 100%' : `📊 ${(calculatePartialAccuracy() * 100).toFixed(0)}%`} {t('game.accuracy')}
                      </Badge>
                      <Badge variant="outline" className="px-6 py-3 border-2 border-blue-400 text-blue-700 font-bold text-lg">
                        ⏱️ {(reactionTime / 1000).toFixed(1)}s
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-700 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <p className="mb-2 font-bold text-base">
                        ✅ {t('game.correct')} <span className="text-2xl">{targetSounds.map(s => s.icon).join(' ')}</span>
                      </p>
                      <p className="text-gray-600 text-xs">
                        ({targetSounds.map(s => {
                          const soundKeyMap: Record<string, string> = {
                            dog: 'dogBark', bell: 'bellRing', water: 'waterDrop', bird: 'birdChirp',
                            horn: 'carHorn', phone: 'phoneRing', cat: 'catMeow', thunder: 'thunder',
                            cow: 'cowMoo', clock: 'clockTick', door: 'doorKnock', clap: 'clapping',
                            baby: 'babyCry', fire: 'fireCrackling', rooster: 'rooster'
                          };
                          return t(`game.sounds.${soundKeyMap[s.soundType] || s.soundType}`);
                        }).join(', ')})
                      </p>
                      {!isCorrect && (
                        <p className="text-gray-700 mt-3 font-medium">
                          {t('game.yourSelection')} <span className="text-2xl">{[...selectedSounds].map(id => 
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
                    🏠 {t('game.returnButton')}
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