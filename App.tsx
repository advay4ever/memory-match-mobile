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
type DifficultyLevel = 'veryeasy' | 'easy' | 'medium' | 'hard' | 'veryhard' | 'expert';
type ConfidenceLevel = 'normal' | 'monitor' | 'concern';

// Difficulty configuration: sounds to remember and distractors
const DIFFICULTY_CONFIG = {
  veryeasy: { soundsToRemember: 2, distractors: 3, totalDisplay: 5 },
  easy: { soundsToRemember: 3, distractors: 3, totalDisplay: 6 },
  medium: { soundsToRemember: 4, distractors: 4, totalDisplay: 8 },
  hard: { soundsToRemember: 5, distractors: 5, totalDisplay: 10 },
  veryhard: { soundsToRemember: 6, distractors: 6, totalDisplay: 12 },
  expert: { soundsToRemember: 7, distractors: 7, totalDisplay: 14 }
};

// Age-adjusted scoring thresholds
// Format: { normal: minForNormal, monitor: minForMonitor } (below monitor = concern)
const SCORING_THRESHOLDS: Record<string, Record<DifficultyLevel, { normal: number; monitor: number }>> = {
  'child': {      // Under 12
    veryeasy: { normal: 90, monitor: 70 },
    easy: { normal: 80, monitor: 60 },
    medium: { normal: 70, monitor: 50 },
    hard: { normal: 60, monitor: 40 },
    veryhard: { normal: 50, monitor: 30 },
    expert: { normal: 40, monitor: 25 }
  },
  'adult': {      // 12-49
    veryeasy: { normal: 95, monitor: 80 },
    easy: { normal: 90, monitor: 70 },
    medium: { normal: 80, monitor: 60 },
    hard: { normal: 70, monitor: 50 },
    veryhard: { normal: 60, monitor: 40 },
    expert: { normal: 50, monitor: 35 }
  },
  'older': {      // 50-64
    veryeasy: { normal: 90, monitor: 75 },
    easy: { normal: 85, monitor: 65 },
    medium: { normal: 75, monitor: 55 },
    hard: { normal: 65, monitor: 45 },
    veryhard: { normal: 55, monitor: 35 },
    expert: { normal: 45, monitor: 30 }
  },
  'senior': {     // 65+
    veryeasy: { normal: 85, monitor: 65 },
    easy: { normal: 75, monitor: 55 },
    medium: { normal: 65, monitor: 45 },
    hard: { normal: 55, monitor: 35 },
    veryhard: { normal: 45, monitor: 25 },
    expert: { normal: 35, monitor: 20 }
  }
};

// Helper function to get age group from age
function getAgeGroup(age: number | null): string {
  if (age === null) return 'adult'; // Default to adult thresholds if no age provided
  if (age < 12) return 'child';
  if (age < 50) return 'adult';
  if (age < 65) return 'older';
  return 'senior';
}

// Get confidence level based on accuracy, age, and difficulty
function getConfidenceLevel(accuracy: number, age: number | null, difficulty: DifficultyLevel): ConfidenceLevel {
  const ageGroup = getAgeGroup(age);
  const thresholds = SCORING_THRESHOLDS[ageGroup][difficulty];
  
  if (accuracy >= thresholds.normal) return 'normal';
  if (accuracy >= thresholds.monitor) return 'monitor';
  return 'concern';
}

// Get confidence level display info
function getConfidenceDisplay(level: ConfidenceLevel): { emoji: string; colorClass: string } {
  switch (level) {
    case 'normal':
      return { emoji: '🟢', colorClass: 'text-green-600' };
    case 'monitor':
      return { emoji: '🟡', colorClass: 'text-yellow-600' };
    case 'concern':
      return { emoji: '🔴', colorClass: 'text-red-600' };
  }
}

interface Sound {
  id: number;
  name: string;
  icon: string;
  description: string;
  soundType: 'dog' | 'bell' | 'water' | 'bird' | 'horn' | 'phone' | 'cat' | 'thunder' | 'cow' | 'clock' | 'door' | 'clap' | 'baby' | 'fire' | 'rooster' | 'horse' | 'frog' | 'rain' | 'goat' | 'duck' | 'bee' | 'hen' | 'cricket' | 'donkey' | 'owl';
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
    { id: 16, name: t('game.sounds.horseNeigh'), icon: '🐎', description: 'Neigh neigh', soundType: 'horse' },
    { id: 17, name: t('game.sounds.frogCroak'), icon: '🐸', description: 'Ribbit ribbit', soundType: 'frog' },
    { id: 18, name: t('game.sounds.rainFall'), icon: '🌧️', description: 'Pitter patter', soundType: 'rain' },
    { id: 19, name: t('game.sounds.goatBleat'), icon: '🐐', description: 'Meh meh', soundType: 'goat' },
    { id: 20, name: t('game.sounds.duckQuack'), icon: '🦆', description: 'Quack quack', soundType: 'duck' },
    { id: 21, name: t('game.sounds.beeBuzz'), icon: '🐝', description: 'Buzz buzz', soundType: 'bee' },
    { id: 22, name: t('game.sounds.henCluck'), icon: '🐔', description: 'Cluck cluck', soundType: 'hen' },
    { id: 23, name: t('game.sounds.cricketChirp'), icon: '🦗', description: 'Chirp chirp', soundType: 'cricket' },
    { id: 24, name: t('game.sounds.donkeyBray'), icon: '🫏', description: 'Hee-haw', soundType: 'donkey' },
    { id: 25, name: t('game.sounds.owlHoot'), icon: '🦉', description: 'Hoot hoot', soundType: 'owl' },
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
  const [participantName, setParticipantName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [showPatientChoice, setShowPatientChoice] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string | null>(null);
  const [patientSearchText, setPatientSearchText] = useState('');
  const [expandedAdaptiveSessions, setExpandedAdaptiveSessions] = useState<Set<number>>(new Set());
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [participantAge, setParticipantAge] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy'); // Start with easy when adaptive is on
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [adaptiveDifficultyEnabled, setAdaptiveDifficultyEnabled] = useState(() => {
    const saved = localStorage.getItem('adaptiveDifficultyEnabled');
    return saved ? JSON.parse(saved) : true; // Default to enabled
  });
  const [difficultyIncreased, setDifficultyIncreased] = useState<{ from: DifficultyLevel; to: DifficultyLevel } | null>(null);
  const [maxLevelReached, setMaxLevelReached] = useState(false);
  
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
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
    { code: 'yo', name: 'Yorùbá', flag: '🇳🇬' },
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
    audio.load(); // Force load on iOS
    return audio;
  }, []);

  // Preload car horn audio
  const carHornAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/car-horn-352443.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload bird chirping audio
  const birdChirpAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/bird-chirping-428659.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload bell ring audio
  const bellRingAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/bell-ring-199839.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload water droplet audio
  const waterDropAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/water-droplet-165637.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  const phoneRingAudio = useMemo(() => {
    const soundPath = `${import.meta.env.BASE_URL}sounds/phone-ringing-382734.mp3?v=2`;
    console.log('Phone ring sound path:', soundPath);
    const audio = new Audio(soundPath);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    audio.onerror = (e) => console.error('Error loading phone ring audio:', e);
    return audio;
  }, []);

  // Preload cat meow audio
  const catMeowAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/cat-meow-401729.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload thunder audio
  const thunderAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/loud-thunder-192165-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload cow moo audio
  const cowMooAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/cow-mooing-343423.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload clock tick audio
  const clockTickAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/clock-ticking-down-376897 (1)-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload door knock audio
  const doorKnockAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/knocking-on-door-6022-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload clapping audio
  const clappingAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/hand-clap-106596-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload baby cry audio
  const babyCryAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/baby-crying-463213-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload fire crackling audio
  const fireCracklingAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/free-fire-crackling-427409-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload rooster audio
  const roosterAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/rooster-crowing-364473.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload horse neigh audio
  const horseNeighAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/the-horse-neighed-433882.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload frog croak audio
  const frogCroakAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/frog-croaking-sound-effect-322956 (1)-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload rain audio
  const rainFallAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/rain-sound-no-copyright-346776-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload goat bleat audio
  const goatBleatAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/goat-baa-390303.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload duck quack audio
  const duckQuackAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/quacking-sound-for-duck-96140.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload bee buzz audio
  const beeBuzzAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/bee-buzzing-6254.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload hen cluck audio
  const henCluckAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/hen-and-chicks-farm-ambience-suara-induk-ayam-dan-anak-ayam-438586-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload cricket chirp audio
  const cricketChirpAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/cricket-sound-113945-[AudioTrimmer.com].mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload donkey bray audio
  const donkeyBrayAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/donkey-1-352697.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Preload owl hoot audio
  const owlHootAudio = useMemo(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/owl-2-139676.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audio.load();
    return audio;
  }, []);

  // Map of all audio elements for iOS unlock
  const allAudioElements = useMemo(() => [
    dogBarkAudio, carHornAudio, birdChirpAudio, bellRingAudio, waterDropAudio,
    phoneRingAudio, catMeowAudio, thunderAudio, cowMooAudio, clockTickAudio,
    doorKnockAudio, clappingAudio, babyCryAudio, fireCracklingAudio, roosterAudio, horseNeighAudio, frogCroakAudio, rainFallAudio, goatBleatAudio, duckQuackAudio, beeBuzzAudio, henCluckAudio, cricketChirpAudio, donkeyBrayAudio, owlHootAudio
  ], [dogBarkAudio, carHornAudio, birdChirpAudio, bellRingAudio, waterDropAudio,
      phoneRingAudio, catMeowAudio, thunderAudio, cowMooAudio, clockTickAudio,
      doorKnockAudio, clappingAudio, babyCryAudio, fireCracklingAudio, roosterAudio, horseNeighAudio, frogCroakAudio, rainFallAudio, goatBleatAudio, duckQuackAudio, beeBuzzAudio, henCluckAudio, cricketChirpAudio, donkeyBrayAudio, owlHootAudio]);

  // Unlock all audio for iOS - must be called on user gesture
  const unlockAudioForIOS = useCallback(() => {
    // Resume AudioContext if suspended
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Play and immediately pause each audio to "unlock" it on iOS
    allAudioElements.forEach(audio => {
      audio.muted = true;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }).catch(() => {
        // Ignore errors during unlock
      });
    });
  }, [audioContext, allAudioElements]);

  const createDogBark = useCallback(() => {
    // Reset and play - don't clone on iOS
    try {
      dogBarkAudio.currentTime = 0;
      dogBarkAudio.play().catch(err => console.error('Error playing dog bark:', err));
    } catch (err) {
      console.error('Error creating dog bark audio:', err);
    }
  }, [dogBarkAudio]);

  const createBellRing = useCallback(() => {
    try {
      bellRingAudio.currentTime = 0;
      bellRingAudio.play().catch(err => console.error('Error playing bell ring:', err));
    } catch (err) {
      console.error('Error creating bell ring audio:', err);
    }
  }, [bellRingAudio]);

  const createWaterDrop = useCallback(() => {
    try {
      waterDropAudio.currentTime = 0;
      waterDropAudio.play().catch(err => console.error('Error playing water drop:', err));
    } catch (err) {
      console.error('Error creating water drop audio:', err);
    }
  }, [waterDropAudio]);

  const createBirdChirp = useCallback(() => {
    try {
      birdChirpAudio.currentTime = 0;
      birdChirpAudio.play().catch(err => console.error('Error playing bird chirp:', err));
    } catch (err) {
      console.error('Error creating bird chirp audio:', err);
    }
  }, [birdChirpAudio]);

  const createCarHorn = useCallback(() => {
    try {
      carHornAudio.currentTime = 0;
      carHornAudio.play().catch(err => console.error('Error playing car horn:', err));
    } catch (err) {
      console.error('Error creating car horn audio:', err);
    }
  }, [carHornAudio]);

  const createPhoneRing = useCallback(() => {
    try {
      phoneRingAudio.currentTime = 0;
      phoneRingAudio.play().catch(err => console.error('Error playing phone ring:', err));
    } catch (err) {
      console.error('Error creating phone ring audio:', err);
    }
  }, [phoneRingAudio]);

  const createCatMeow = useCallback(() => {
    try {
      catMeowAudio.currentTime = 0;
      catMeowAudio.play().catch(err => console.error('Error playing cat meow:', err));
    } catch (err) {
      console.error('Error creating cat meow audio:', err);
    }
  }, [catMeowAudio]);

  const createThunder = useCallback(() => {
    try {
      thunderAudio.currentTime = 0;
      thunderAudio.play().catch(err => console.error('Error playing thunder:', err));
    } catch (err) {
      console.error('Error creating thunder audio:', err);
    }
  }, [thunderAudio]);

  const createCowMoo = useCallback(() => {
    try {
      cowMooAudio.currentTime = 0;
      cowMooAudio.play().catch(err => console.error('Error playing cow moo:', err));
    } catch (err) {
      console.error('Error creating cow moo audio:', err);
    }
  }, [cowMooAudio]);

  const createClockTick = useCallback(() => {
    try {
      clockTickAudio.currentTime = 0;
      clockTickAudio.play().catch(err => console.error('Error playing clock tick:', err));
    } catch (err) {
      console.error('Error creating clock tick audio:', err);
    }
  }, [clockTickAudio]);

  const createDoorKnock = useCallback(() => {
    try {
      doorKnockAudio.currentTime = 0;
      doorKnockAudio.play().catch(err => console.error('Error playing door knock:', err));
    } catch (err) {
      console.error('Error creating door knock audio:', err);
    }
  }, [doorKnockAudio]);

  const createClapping = useCallback(() => {
    try {
      clappingAudio.currentTime = 0;
      clappingAudio.play().catch(err => console.error('Error playing clapping:', err));
    } catch (err) {
      console.error('Error creating clapping audio:', err);
    }
  }, [clappingAudio]);

  const createBabyCry = useCallback(() => {
    try {
      babyCryAudio.currentTime = 0;
      babyCryAudio.play().catch(err => console.error('Error playing baby cry:', err));
    } catch (err) {
      console.error('Error creating baby cry audio:', err);
    }
  }, [babyCryAudio]);

  const createFireCrackling = useCallback(() => {
    try {
      fireCracklingAudio.currentTime = 0;
      fireCracklingAudio.play().catch(err => console.error('Error playing fire crackling:', err));
    } catch (err) {
      console.error('Error creating fire crackling audio:', err);
    }
  }, [fireCracklingAudio]);

  const createRooster = useCallback(() => {
    try {
      roosterAudio.currentTime = 0;
      roosterAudio.play().catch(err => console.error('Error playing rooster:', err));
    } catch (err) {
      console.error('Error creating rooster audio:', err);
    }
  }, [roosterAudio]);

  const createHorseNeigh = useCallback(() => {
    try {
      horseNeighAudio.currentTime = 0;
      horseNeighAudio.play().catch(err => console.error('Error playing horse neigh:', err));
    } catch (err) {
      console.error('Error creating horse neigh audio:', err);
    }
  }, [horseNeighAudio]);

  const createFrogCroak = useCallback(() => {
    try {
      frogCroakAudio.currentTime = 0;
      frogCroakAudio.play().catch(err => console.error('Error playing frog croak:', err));
    } catch (err) {
      console.error('Error creating frog croak audio:', err);
    }
  }, [frogCroakAudio]);

  const createRainFall = useCallback(() => {
    try {
      rainFallAudio.currentTime = 0;
      rainFallAudio.play().catch(err => console.error('Error playing rain fall:', err));
    } catch (err) {
      console.error('Error creating rain fall audio:', err);
    }
  }, [rainFallAudio]);

  const createGoatBleat = useCallback(() => {
    try {
      goatBleatAudio.currentTime = 0;
      goatBleatAudio.play().catch(err => console.error('Error playing goat bleat:', err));
    } catch (err) {
      console.error('Error creating goat bleat audio:', err);
    }
  }, [goatBleatAudio]);

  const createDuckQuack = useCallback(() => {
    try {
      duckQuackAudio.currentTime = 0;
      duckQuackAudio.play().catch(err => console.error('Error playing duck quack:', err));
    } catch (err) {
      console.error('Error creating duck quack audio:', err);
    }
  }, [duckQuackAudio]);

  const createBeeBuzz = useCallback(() => {
    try {
      beeBuzzAudio.currentTime = 0;
      beeBuzzAudio.play().catch(err => console.error('Error playing bee buzz:', err));
    } catch (err) {
      console.error('Error creating bee buzz audio:', err);
    }
  }, [beeBuzzAudio]);

  const createHenCluck = useCallback(() => {
    try {
      henCluckAudio.currentTime = 0;
      henCluckAudio.play().catch(err => console.error('Error playing hen cluck:', err));
    } catch (err) {
      console.error('Error creating hen cluck audio:', err);
    }
  }, [henCluckAudio]);

  const createCricketChirp = useCallback(() => {
    try {
      cricketChirpAudio.currentTime = 0;
      cricketChirpAudio.play().catch(err => console.error('Error playing cricket chirp:', err));
    } catch (err) {
      console.error('Error creating cricket chirp audio:', err);
    }
  }, [cricketChirpAudio]);

  const createDonkeyBray = useCallback(() => {
    try {
      donkeyBrayAudio.currentTime = 0;
      donkeyBrayAudio.play().catch(err => console.error('Error playing donkey bray:', err));
    } catch (err) {
      console.error('Error creating donkey bray audio:', err);
    }
  }, [donkeyBrayAudio]);

  const createOwlHoot = useCallback(() => {
    try {
      owlHootAudio.currentTime = 0;
      owlHootAudio.play().catch(err => console.error('Error playing owl hoot:', err));
    } catch (err) {
      console.error('Error creating owl hoot audio:', err);
    }
  }, [owlHootAudio]);

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
      case 'horse':
        createHorseNeigh();
        break;
      case 'frog':
        createFrogCroak();
        break;
      case 'rain':
        createRainFall();
        break;
      case 'goat':
        createGoatBleat();
        break;
      case 'duck':
        createDuckQuack();
        break;
      case 'bee':
        createBeeBuzz();
        break;
      case 'hen':
        createHenCluck();
        break;
      case 'cricket':
        createCricketChirp();
        break;
      case 'donkey':
        createDonkeyBray();
        break;
      case 'owl':
        createOwlHoot();
        break;
    }
  }, [audioContext, createDogBark, createBellRing, createWaterDrop, createBirdChirp, createCarHorn, createPhoneRing, createCatMeow, createThunder, createCowMoo, createClockTick, createDoorKnock, createClapping, createBabyCry, createFireCrackling, createRooster, createHorseNeigh, createFrogCroak, createRainFall, createGoatBleat, createDuckQuack, createBeeBuzz, createHenCluck, createCricketChirp, createDonkeyBray, createOwlHoot]);

  const handleStartTestClick = () => {
    // If we already have a participant name, show the choice dialog
    if (participantName) {
      setShowPatientChoice(true);
    } else {
      // First time - show name input
      setShowNameInput(true);
    }
  };

  const handleSamePatient = () => {
    // Continue with the same participant, increment attempt number
    const attempt = dataManager.current.getNextAttemptNumber(participantName);
    setAttemptNumber(attempt);
    setShowPatientChoice(false);
    
    // Always reset to Very Easy difficulty when starting a new session
    const startingDifficulty: DifficultyLevel = 'veryeasy';
    setDifficulty(startingDifficulty);
    
    // If adaptive mode is ON, skip difficulty selector and start immediately
    if (adaptiveDifficultyEnabled) {
      startGame(startingDifficulty);
    } else {
      // Show difficulty selector for manual mode
      setShowDifficultySelector(true);
    }
  };

  const handleDifferentPatient = () => {
    setShowPatientChoice(false);
    setParticipantAge(null); // Reset age for new patient
    // Reset difficulty to veryeasy (will be set properly in handleNameSubmit)
    setDifficulty('veryeasy');
    setShowNameInput(true);
  };

  // Get suggested difficulty based on age
  // Easy: Children (<12) and Seniors (65+)
  // Medium: Adolescents (12-17) and Older Adults (50-64)
  // Hard: Adults (18-49)
  const getSuggestedDifficulty = (age: number | null): DifficultyLevel => {
    if (age === null) return 'medium';
    if (age < 12) return 'easy';      // Children
    if (age >= 65) return 'easy';     // Seniors
    if (age < 18) return 'medium';    // Adolescents
    if (age >= 50) return 'medium';   // Older adults
    return 'hard';                     // Adults 18-49
  };

  const handleNameSubmit = (name: string, age: number | null) => {
    const trimmedName = name.trim() || 'Anonymous';
    setParticipantName(trimmedName);
    setParticipantAge(age);
    const attempt = dataManager.current.getNextAttemptNumber(trimmedName);
    setAttemptNumber(attempt);
    setShowNameInput(false);
    
    // Always reset to Very Easy difficulty when starting a new session
    const startingDifficulty: DifficultyLevel = 'veryeasy';
    setDifficulty(startingDifficulty);
    
    // If adaptive mode is ON, skip difficulty selector and start immediately
    if (adaptiveDifficultyEnabled) {
      startGame(startingDifficulty);
    } else {
      // Show difficulty selector for manual mode
      setShowDifficultySelector(true);
    }
  };

  const handleDifficultySelect = (level: DifficultyLevel) => {
    setDifficulty(level);
    setShowDifficultySelector(false);
    startGame(level);
  };

  const startGame = (selectedDifficulty: DifficultyLevel = difficulty) => {
    // Unlock audio for iOS on user gesture
    unlockAudioForIOS();
    
    const config = DIFFICULTY_CONFIG[selectedDifficulty];
    
    // Select sounds based on difficulty
    const shuffled = [...GAME_SOUNDS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, config.soundsToRemember);
    
    // Get distractor sounds (sounds not in selected)
    const selectedIds = new Set(selected.map(s => s.id));
    const distractors = GAME_SOUNDS.filter(s => !selectedIds.has(s.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, config.distractors);
    
    // Combine and shuffle for display
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
    
    // Sound duration estimates (in ms) + 1 second gap
    const soundDurations: Record<string, number> = {
      dog: 2000,
      bell: 2500,
      water: 1500,
      bird: 3000,
      horn: 2000,
      phone: 3000,
      cat: 2000,
      thunder: 4000,
      cow: 2500,
      clock: 3000,
      door: 2000,
      clap: 2000,
      baby: 3000,
      fire: 3000,
      rooster: 3000
    };
    
    // Wait for sound to finish + 0.5 second gap
    const duration = soundDurations[sound.soundType] || 3000;
    
    setTimeout(() => {
      setCurrentSoundIndex(prev => prev + 1);
    }, duration + 500); // Sound duration + 0.5 second gap
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
    } else if (newSelection.size < targetSounds.length) { // Limit based on difficulty
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
      participantName: participantName,
      attemptNumber: attemptNumber,
      accuracy: accuracy,
      reactionTime: calculatedReactionTime,
      correctSounds: targetSounds.map(s => s.name),
      selectedSounds: [...selectedSounds].map(id => 
        GAME_SOUNDS.find(s => s.id === id)?.name || 'Unknown'
      ),
      gameNumber: sessionNumber,
      isCorrect: isCorrect,
      difficulty: difficulty,
      participantAge: participantAge,
      mode: adaptiveDifficultyEnabled ? 'adaptive' : 'manual'
    };
    
    dataManager.current.saveSession(sessionData);
    
    // Check for alerts
    const needsAlert = dataManager.current.checkAlertConditions();
    setShowAlert(needsAlert);
    
    // Handle adaptive difficulty - Auto-advance on 100%
    setDifficultyIncreased(null);
    setMaxLevelReached(false);
    
    if (adaptiveDifficultyEnabled && isCorrect) {
      if (difficulty === 'expert') {
        // At max level, show results
        setMaxLevelReached(true);
        setGamePhase('feedback');
      } else {
        // Auto-advance to next difficulty without showing results
        let nextDifficulty: DifficultyLevel = 'easy';
        if (difficulty === 'veryeasy') {
          nextDifficulty = 'easy';
        } else if (difficulty === 'easy') {
          nextDifficulty = 'medium';
        } else if (difficulty === 'medium') {
          nextDifficulty = 'hard';
        } else if (difficulty === 'hard') {
          nextDifficulty = 'veryhard';
        } else if (difficulty === 'veryhard') {
          nextDifficulty = 'expert';
        }
        
        setDifficulty(nextDifficulty);
        
        // Reset and start next round immediately
        setSelectedSounds(new Set());
        setCurrentSoundIndex(0);
        setGamePhase('listen');
        
        // Generate new sequence for the new difficulty
        setTimeout(() => {
          const config = DIFFICULTY_CONFIG[nextDifficulty];
          const shuffled = [...GAME_SOUNDS].sort(() => Math.random() - 0.5);
          const newSequence = shuffled.slice(0, config.soundsToRemember);
          
          // Get distractor sounds (sounds not in newSequence)
          const selectedIds = new Set(newSequence.map(s => s.id));
          const distractors = GAME_SOUNDS.filter(s => !selectedIds.has(s.id))
            .sort(() => Math.random() - 0.5)
            .slice(0, config.distractors);
          
          // Combine and shuffle for display
          const allDisplaySounds = [...newSequence, ...distractors].sort(() => Math.random() - 0.5);
          
          setTargetSounds(newSequence);
          setDisplaySounds(allDisplaySounds);
        }, 100);
      }
    } else {
      // Not adaptive or got wrong answer - show results
      setGamePhase('feedback');
    }
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
    setDifficultyIncreased(null);
    setMaxLevelReached(false);
  };

  const toggleAdaptiveDifficulty = () => {
    const newValue = !adaptiveDifficultyEnabled;
    setAdaptiveDifficultyEnabled(newValue);
    localStorage.setItem('adaptiveDifficultyEnabled', JSON.stringify(newValue));
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
        {/* Desktop: Absolute positioned buttons in top-right corner */}
        <div className="hidden sm:flex absolute top-4 right-4 items-center gap-2">
          {/* Language Selector - Desktop */}
          <div className="relative lang-selector-container">
            <Button
              onClick={() => setShowLangSelector(!showLangSelector)}
              variant="outline"
              size="default"
              className="border-2 border-gray-300 hover:border-blue-500 px-3 py-2"
            >
              <Globe className="w-5 h-5 mr-1" />
              <span className="text-lg">{currentLang.flag}</span>
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
          
          {/* Home Button - Desktop */}
          {userRole === 'operator' && (
            <Button 
              onClick={() => setShowLanding(true)}
              variant="outline"
              size="default"
              className="border-2 border-gray-700 hover:border-blue-600 hover:bg-blue-50 text-gray-900 font-bold text-base px-4 py-2"
            >
              ← {t('common.home')}
            </Button>
          )}
          
          {userRole === 'patient' && (
            <Badge variant="secondary" className="px-3 py-2 bg-blue-600 text-white border-0">
              <Clock className="w-3 h-3 mr-1" />
              {Math.round(reactionTime / 1000)}s
            </Badge>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{t('game.title')} 🎮</h1>
            <p className="text-sm text-gray-600 font-medium truncate">
              {userRole === 'operator' ? `🎯 ${t('game.operatorView')}` : t('game.sessionNumber', { number: sessionNumber })}
            </p>
          </div>
          
          {/* Mobile: Inline buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 sm:hidden">
            {/* Language Selector Button - Mobile */}
            <div className="relative lang-selector-container">
              <Button
                onClick={() => setShowLangSelector(!showLangSelector)}
                variant="outline"
                size="default"
                className="border-2 border-gray-300 hover:border-blue-500 px-3 py-2"
              >
                <Globe className="w-5 h-5 mr-1" />
                <span className="text-lg">{currentLang.flag}</span>
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
            
            {/* Home Button - Mobile: Inline next to language selector */}
            {userRole === 'operator' && (
              <Button 
                onClick={() => setShowLanding(true)}
                variant="outline"
                size="sm"
                className="border-2 border-gray-700 hover:border-blue-600 hover:bg-blue-50 text-gray-900 font-bold px-2 py-1 text-sm"
              >
                ← {t('common.home')}
              </Button>
            )}
            
            {userRole === 'patient' && (
              <Badge variant="secondary" className="px-3 py-2 bg-blue-600 text-white border-0">
                <Clock className="w-3 h-3 mr-1" />
                {Math.round(reactionTime / 1000)}s
              </Badge>
            )}
          </div>
        </div>
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
                    {/* Adaptive Difficulty Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <div>
                        <p className="font-bold text-gray-800">📈 {t('game.adaptiveDifficulty')}</p>
                        <p className="text-sm text-gray-500">{t('game.adaptiveDifficultyHint')}</p>
                      </div>
                      <button
                        onClick={toggleAdaptiveDifficulty}
                        className={`w-14 h-8 rounded-full transition-colors flex items-center ${
                          adaptiveDifficultyEnabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                          adaptiveDifficultyEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <p className="text-lg text-gray-600 text-center font-medium">
                      👨‍⚕️ {t('game.operatorInstruction')}
                    </p>
                    <Button 
                      onClick={handleStartTestClick}
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-7 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Play className="w-7 h-7 mr-2" />
                      🚀 {t('game.startTest')}
                    </Button>
                    
                    {recentSessions.length > 0 && (
                      <Button
                        onClick={() => setShowAllSessions(true)}
                        variant="outline"
                        size="lg"
                        className="w-full border-2 border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-600 font-semibold"
                      >
                        📊 {t('game.viewAllSessions')}
                      </Button>
                    )}
                    
                    {recentSessions.length > 0 && (
                      <Button
                        onClick={() => setShowClearConfirm(true)}
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
                  
                  {/* Difficulty Badge */}
                  <div className="flex justify-center mb-4">
                    <Badge className={`text-sm px-3 py-1 ${
                      difficulty === 'easy' ? 'bg-green-100 text-green-800 border-green-300' :
                      difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                      difficulty === 'hard' ? 'bg-red-100 text-red-800 border-red-300' :
                      difficulty === 'veryhard' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                      'bg-indigo-100 text-indigo-800 border-indigo-300'
                    }`}>
                      {difficulty === 'easy' && '🟢'} 
                      {difficulty === 'medium' && '🟡'} 
                      {difficulty === 'hard' && '🔴'} 
                      {difficulty === 'veryhard' && '🟣'} 
                      {difficulty === 'expert' && '👑'} 
                      {' '}{t(`game.difficulty${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-lg text-white font-bold">1</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        🎵 {t('game.instruction1Dynamic', { count: DIFFICULTY_CONFIG[difficulty].soundsToRemember })}
                        <span className="text-2xl ml-2">🐕 🔔 💧</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-lg text-white font-bold">2</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        ⏳ {t('game.instruction2')}
                        <span className="text-sm text-gray-600 ml-1">(8 sec countdown)</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-lg text-white font-bold">3</span>
                      </div>
                      <p className="text-gray-800 font-medium">
                        👆 {t('game.instruction3Dynamic', { count: DIFFICULTY_CONFIG[difficulty].soundsToRemember })}
                        <span className="text-sm text-blue-600 font-semibold ml-1">(tap = blue)</span>
                      </p>
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
                  <h2 className="text-4xl mb-4 text-center font-bold text-blue-900">
                    🎯 {t('game.selectionTitle', { count: targetSounds.length })}
                  </h2>
                  <p className="text-xl text-gray-700 text-center mb-6 font-medium">
                    {t('game.selectionInstruction', { count: selectedSounds.size, total: targetSounds.length })}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-5 mb-6">
                    {displaySounds.map((sound) => (
                      <motion.button
                        key={sound.id}
                        onClick={() => handleSoundSelection(sound.id)}
                        disabled={!selectedSounds.has(sound.id) && selectedSounds.size >= targetSounds.length}
                        className={`aspect-square rounded-3xl flex flex-col items-center justify-center p-6 border-4 transition-all shadow-lg ${
                          selectedSounds.has(sound.id)
                            ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-105'
                            : selectedSounds.size >= targetSounds.length
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:shadow-xl'
                        }`}
                        whileTap={{ scale: 0.9 }}
                        whileHover={selectedSounds.has(sound.id) || selectedSounds.size < targetSounds.length ? { scale: 1.1 } : {}}
                      >
                        <span className="text-7xl mb-3">{sound.icon}</span>
                        <span className="text-lg text-center font-bold">{sound.name}</span>
                      </motion.button>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={submitAnswer}
                    disabled={selectedSounds.size !== targetSounds.length}
                    className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 font-bold text-2xl py-6 shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    ✅ {t('game.submitButton', { count: selectedSounds.size, total: targetSounds.length })}
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
                    
                    {/* Age-Adjusted Confidence Indicator */}
                    {(() => {
                      const accuracy = isCorrect ? 100 : calculatePartialAccuracy() * 100;
                      const confidenceLevel = getConfidenceLevel(accuracy, participantAge, difficulty);
                      const { emoji, colorClass } = getConfidenceDisplay(confidenceLevel);
                      return (
                        <div className={`flex items-center justify-center space-x-2 p-3 rounded-xl ${
                          confidenceLevel === 'normal' ? 'bg-green-50 border-2 border-green-200' :
                          confidenceLevel === 'monitor' ? 'bg-yellow-50 border-2 border-yellow-200' :
                          'bg-red-50 border-2 border-red-200'
                        }`}>
                          <span className="text-2xl">{emoji}</span>
                          <span className={`font-bold ${colorClass}`}>
                            {t(`game.confidence.${confidenceLevel}`)}
                          </span>
                          {participantAge && (
                            <span className="text-sm text-gray-500">
                              ({t('game.forAge', { age: participantAge })})
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    
                    {/* Adaptive Difficulty Notification */}
                    {difficultyIncreased && (
                      <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                        <p className="font-bold text-purple-800 text-lg">📈 {t('game.difficultyIncreased')}</p>
                        <p className="text-purple-600">
                          {t(`game.difficulty${difficultyIncreased.from.charAt(0).toUpperCase() + difficultyIncreased.from.slice(1)}`)} → {t(`game.difficulty${difficultyIncreased.to.charAt(0).toUpperCase() + difficultyIncreased.to.slice(1)}`)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{t('game.nextTestHigherDifficulty')}</p>
                      </div>
                    )}
                    
                    {maxLevelReached && (
                      <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                        <p className="font-bold text-amber-800 text-lg">🏆 {t('game.maxLevelReached')}</p>
                        <p className="text-sm text-amber-600">{t('game.maxLevelHint')}</p>
                      </div>
                    )}
                    
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
                  
                  {/* Retry Button - Only show in adaptive mode when answer is wrong */}
                  {adaptiveDifficultyEnabled && !isCorrect && (
                    <Button 
                      onClick={() => {
                        // Reset game to current difficulty level
                        setSelectedSounds(new Set());
                        setCurrentSoundIndex(0);
                        setGamePhase('instructions');
                      }}
                      size="lg"
                      className="w-full mb-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      🔄 {t('game.retry')}
                    </Button>
                  )}
                  
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

      {/* Patient Choice Modal - Same or Different Patient */}
      {showPatientChoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              👤 {t('game.selectPatient')}
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {t('game.lastPatient')}: <span className="font-bold text-blue-600">{participantName}</span>
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleSamePatient}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg"
              >
                ✅ {t('game.samePatient')} ({participantName})
              </Button>
              <Button
                onClick={handleDifferentPatient}
                variant="outline"
                size="lg"
                className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-bold py-6 text-lg"
              >
                ➕ {t('game.differentPatient')}
              </Button>
              <Button
                onClick={() => setShowPatientChoice(false)}
                variant="ghost"
                size="lg"
                className="w-full text-gray-500 hover:text-gray-700"
              >
                {t('game.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Name Input Modal */}
      {showNameInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              👤 {t('game.enterName')}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const nameInput = e.currentTarget.querySelector('input[name="name"]') as HTMLInputElement;
              const ageInput = e.currentTarget.querySelector('input[name="age"]') as HTMLInputElement;
              const age = ageInput.value ? parseInt(ageInput.value, 10) : null;
              handleNameSubmit(nameInput.value, age);
            }}>
              <input
                type="text"
                name="name"
                autoFocus
                placeholder={t('game.namePlaceholder')}
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl mb-4 focus:border-blue-500 focus:outline-none"
              />
              <input
                type="number"
                name="age"
                min="1"
                max="120"
                placeholder={t('game.agePlaceholder')}
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl mb-4 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-sm text-gray-500 mb-4 text-center">
                💡 {t('game.ageHint')}
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1 border-2"
                  onClick={() => setShowNameInput(false)}
                >
                  {t('game.cancel')}
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  {t('game.continue')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Difficulty Selector Modal */}
      {showDifficultySelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              🎯 {t('game.selectDifficulty')}
            </h2>
            {participantAge ? (
              <p className="text-gray-600 text-center mb-4">
                👤 {participantName}, {participantAge} {t('game.yearsOld')}
              </p>
            ) : (
              <p className="text-gray-500 text-center mb-4 text-sm">
                {t('game.chooseDifficulty')}
              </p>
            )}
            <div className="space-y-3">
              <Button
                onClick={() => handleDifficultySelect('veryeasy')}
                size="lg"
                className="w-full py-6 text-lg font-bold transition-all bg-blue-100 hover:bg-blue-200 text-blue-800 border-2 border-blue-300"
              >
                <span className="text-2xl mr-2">⭐</span>
                {t('game.difficultyVeryeasy')}
                <span className="block text-sm font-normal mt-1 opacity-80">
                  {t('game.veryeasySounds')}
                </span>
              </Button>
              <Button
                onClick={() => handleDifficultySelect('easy')}
                size="lg"
                className={`w-full py-6 text-lg font-bold transition-all ${
                  difficulty === 'easy' 
                    ? 'bg-green-600 hover:bg-green-700 text-white ring-4 ring-green-300' 
                    : 'bg-green-100 hover:bg-green-200 text-green-800 border-2 border-green-300'
                }`}
              >
                <span className="text-2xl mr-2">🟢</span>
                {t('game.difficultyEasy')}
                <span className="block text-sm font-normal mt-1 opacity-80">
                  {t('game.easySounds')}
                </span>
              </Button>
              <Button
                onClick={() => handleDifficultySelect('medium')}
                size="lg"
                className={`w-full py-6 text-lg font-bold transition-all ${
                  difficulty === 'medium' 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white ring-4 ring-yellow-300' 
                    : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-2 border-yellow-300'
                }`}
              >
                <span className="text-2xl mr-2">🟡</span>
                {t('game.difficultyMedium')}
                <span className="block text-sm font-normal mt-1 opacity-80">
                  {t('game.mediumSounds')}
                </span>
              </Button>
              <Button
                onClick={() => handleDifficultySelect('hard')}
                size="lg"
                className={`w-full py-6 text-lg font-bold transition-all ${
                  difficulty === 'hard' 
                    ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-300' 
                    : 'bg-red-100 hover:bg-red-200 text-red-800 border-2 border-red-300'
                }`}
              >
                <span className="text-2xl mr-2">🔴</span>
                {t('game.difficultyHard')}
                <span className="block text-sm font-normal mt-1 opacity-80">
                  {t('game.hardSounds')}
                </span>
              </Button>
              <Button
                onClick={() => handleDifficultySelect('veryhard')}
                size="lg"
                className={`w-full py-6 text-lg font-bold transition-all ${
                  difficulty === 'veryhard' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white ring-4 ring-purple-300' 
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-2 border-purple-300'
                }`}
              >
                <span className="text-2xl mr-2">🟣</span>
                {t('game.difficultyVeryhard')}
                <span className="block text-sm font-normal mt-1 opacity-80">
                  {t('game.veryhardSounds')}
                </span>
              </Button>
              <Button
                onClick={() => handleDifficultySelect('expert')}
                size="lg"
                className={`w-full py-6 text-lg font-bold transition-all ${
                  difficulty === 'expert' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-4 ring-indigo-300' 
                    : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border-2 border-indigo-300'
                }`}
              >
                <span className="text-2xl mr-2">👑</span>
                {t('game.difficultyExpert')}
                <span className="block text-sm font-normal mt-1 opacity-80">
                  {t('game.expertSounds')}
                </span>
              </Button>
            </div>
            <Button
              onClick={() => setShowDifficultySelector(false)}
              variant="ghost"
              size="lg"
              className="w-full mt-4 text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:text-black active:font-bold transition-all"
            >
              {t('game.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* View All Sessions Modal */}
      {showAllSessions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              📊 {t('game.allSessions')}
            </h2>
            
            {/* Search Box */}
            <div className="mb-4">
              <input
                type="text"
                value={patientSearchText}
                onChange={(e) => {
                  setPatientSearchText(e.target.value);
                  setSelectedPatientFilter(null); // Clear button selection when typing
                }}
                placeholder={`🔍 ${t('game.filterByPatient')}...`}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            {/* Patient Filter Buttons */}
            {dataManager.current.getParticipantNames().length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => { setSelectedPatientFilter(null); setPatientSearchText(''); }}
                    variant={selectedPatientFilter === null && patientSearchText === '' ? "default" : "outline"}
                    size="sm"
                    className={`${selectedPatientFilter === null && patientSearchText === '' ? 'bg-blue-600 text-white' : 'border-2'}`}
                  >
                    👥 {t('game.allPatients')}
                  </Button>
                  {dataManager.current.getParticipantNames()
                    .filter(name => patientSearchText === '' || name.toLowerCase().includes(patientSearchText.toLowerCase()))
                    .map((name) => (
                    <Button
                      key={name}
                      onClick={() => { setSelectedPatientFilter(name); setPatientSearchText(''); }}
                      variant={selectedPatientFilter === name ? "default" : "outline"}
                      size="sm"
                      className={`${selectedPatientFilter === name ? 'bg-green-600 text-white' : 'border-2 border-green-300 text-green-700 hover:bg-green-50'}`}
                    >
                      👤 {name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {(() => {
                const allSessions = dataManager.current.getAllSessionsSorted();
                // Filter by button selection OR by search text
                const filteredSessions = selectedPatientFilter 
                  ? allSessions.filter(s => s.participantName === selectedPatientFilter)
                  : patientSearchText
                    ? allSessions.filter(s => s.participantName?.toLowerCase().includes(patientSearchText.toLowerCase()))
                    : allSessions;
                
                if (filteredSessions.length === 0) {
                  return <p className="text-center text-gray-500 py-8">{t('game.noSessions')}</p>;
                }
                
                // Group sessions by gameNumber for adaptive mode
                const groupedSessions = new Map<number, typeof filteredSessions>();
                const manualSessions: typeof filteredSessions = [];
                
                filteredSessions.forEach(session => {
                  if (session.mode === 'adaptive') {
                    const existing = groupedSessions.get(session.gameNumber) || [];
                    existing.push(session);
                    groupedSessions.set(session.gameNumber, existing);
                  } else {
                    manualSessions.push(session);
                  }
                });
                
                // Convert to array and sort by first session's timestamp
                const adaptiveGroups = Array.from(groupedSessions.entries())
                  .map(([gameNum, sessions]) => ({
                    gameNumber: gameNum,
                    sessions: sessions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
                    firstTimestamp: new Date(sessions[0].timestamp).getTime()
                  }))
                  .sort((a, b) => b.firstTimestamp - a.firstTimestamp);
                
                // Combine adaptive groups and manual sessions, sorted by timestamp
                const allItems: { type: 'adaptive' | 'manual', data: typeof filteredSessions[0] | typeof adaptiveGroups[0] }[] = [
                  ...adaptiveGroups.map(g => ({ type: 'adaptive' as const, data: g })),
                  ...manualSessions.map(s => ({ type: 'manual' as const, data: s }))
                ].sort((a, b) => {
                  const timeA = a.type === 'adaptive' 
                    ? (a.data as typeof adaptiveGroups[0]).firstTimestamp 
                    : new Date((a.data as typeof filteredSessions[0]).timestamp).getTime();
                  const timeB = b.type === 'adaptive' 
                    ? (b.data as typeof adaptiveGroups[0]).firstTimestamp 
                    : new Date((b.data as typeof filteredSessions[0]).timestamp).getTime();
                  return timeB - timeA;
                });
                
                return allItems.map((item, index) => {
                  if (item.type === 'manual') {
                    const session = item.data as typeof filteredSessions[0];
                    return (
                      <div 
                        key={session.id}
                        className={`p-3 rounded-xl border-2 ${
                          session.accuracy >= 60 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-bold text-gray-800">
                              {session.participantName || 'Anonymous'}
                            </span>
                            <span className="text-xs ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                              {t('game.manualMode')}
                            </span>
                          </div>
                          <span className={`font-bold ${session.accuracy >= 60 ? 'text-green-700' : 'text-red-700'}`}>
                            {session.accuracy.toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          📅 {new Date(session.timestamp).toLocaleDateString()} {new Date(session.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ⏱️ {(session.reactionTime / 1000).toFixed(1)}s • 🎯 {t(`game.difficulty${(session.difficulty || 'easy').charAt(0).toUpperCase() + (session.difficulty || 'easy').slice(1)}`)}
                        </div>
                      </div>
                    );
                  } else {
                    const group = item.data as typeof adaptiveGroups[0];
                    const isExpanded = expandedAdaptiveSessions.has(group.gameNumber);
                    const lastSession = group.sessions[group.sessions.length - 1];
                    const highestDifficulty = group.sessions.reduce((max, s) => {
                      const order = ['veryeasy', 'easy', 'medium', 'hard', 'veryhard', 'expert'];
                      return order.indexOf(s.difficulty || 'easy') > order.indexOf(max) ? (s.difficulty || 'easy') : max;
                    }, 'veryeasy');
                    const allCorrect = group.sessions.every(s => s.isCorrect);
                    
                    return (
                      <div key={`adaptive-${group.gameNumber}`} className="rounded-xl border-2 border-purple-200 overflow-hidden">
                        <div 
                          className={`p-3 cursor-pointer hover:bg-purple-100 transition-colors ${
                            allCorrect ? 'bg-purple-50' : 'bg-orange-50'
                          }`}
                          onClick={() => {
                            setExpandedAdaptiveSessions(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(group.gameNumber)) {
                                newSet.delete(group.gameNumber);
                              } else {
                                newSet.add(group.gameNumber);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-bold text-gray-800">
                                {group.sessions[0].participantName || 'Anonymous'}
                              </span>
                              <span className="text-xs ml-2 px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full">
                                {t('game.adaptiveMode')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-purple-700">
                                {group.sessions.length} {t('game.rounds')}
                              </span>
                              <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            📅 {new Date(group.sessions[0].timestamp).toLocaleDateString()} {new Date(group.sessions[0].timestamp).toLocaleTimeString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            🏆 {t('game.reached')}: {t(`game.difficulty${highestDifficulty.charAt(0).toUpperCase() + highestDifficulty.slice(1)}`)}
                            {!allCorrect && <span className="ml-2 text-orange-600">• {t('game.stoppedAt')} {t(`game.difficulty${(lastSession.difficulty || 'easy').charAt(0).toUpperCase() + (lastSession.difficulty || 'easy').slice(1)}`)}</span>}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t border-purple-200 bg-white p-2 space-y-2">
                            {group.sessions.map((session, idx) => (
                              <div 
                                key={session.id}
                                className={`p-2 rounded-lg text-sm ${
                                  session.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">
                                    {idx + 1}. {t(`game.difficulty${(session.difficulty || 'easy').charAt(0).toUpperCase() + (session.difficulty || 'easy').slice(1)}`)}
                                  </span>
                                  <span className={`font-bold ${session.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                    {session.isCorrect ? '✓ 100%' : `✗ ${session.accuracy.toFixed(0)}%`}
                                  </span>
                                </div>
                                {!session.isCorrect && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {t('game.expected')}: {session.correctSounds?.join(', ')}
                                    <br/>
                                    {t('game.selected')}: {session.selectedSounds?.join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                });
              })()}
            </div>
            <Button
              onClick={() => {
                setShowAllSessions(false);
                setSelectedPatientFilter(null);
                setPatientSearchText('');
              }}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {t('game.close')}
            </Button>
          </div>
        </div>
      )}

      {/* Clear All Sessions Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('game.clearAllSessions')}
            </h2>
            <p className="text-gray-600 mb-6 text-lg">
              {t('game.clearConfirm')}
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowClearConfirm(false)}
                variant="outline"
                size="lg"
                className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold"
              >
                {t('game.cancel')}
              </Button>
              <Button
                onClick={() => {
                  dataManager.current.clearAllData();
                  setSessionNumber(1);
                  setShowClearConfirm(false);
                  window.location.reload();
                }}
                size="lg"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                🗑️ {t('game.clearAllSessions')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}