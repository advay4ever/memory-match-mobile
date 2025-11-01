# Mobile & Web App Strategy for Memory Match Cognitive Assessment Tool

## Executive Summary

This document outlines the recommended strategy for maintaining both mobile and web application versions of the Memory Match cognitive assessment tool while maximizing code reuse, maintainability, and development efficiency.

## Current State Analysis

### Existing Technology Stack
- **Frontend Framework**: React 18.2.0 with TypeScript
- **Build Tool**: Vite (fast development server & bundler)
- **Styling**: Tailwind CSS + Radix UI components
- **Animation**: Framer Motion
- **Audio**: Web Audio API for sound generation
- **Architecture**: Component-based with custom hooks

### Strengths of Current Implementation
- ✅ **Healthcare-Ready**: Accessible UI components (Radix)
- ✅ **Mobile-Responsive**: Already works on mobile browsers
- ✅ **Type-Safe**: TypeScript prevents runtime errors
- ✅ **Performance**: Fast Vite development and build process
- ✅ **Maintainable**: Clean component architecture

## Recommended Architecture: Multi-Platform Monorepo

### Framework Strategy Overview
```
┌─────────────────────────────────────────────────────────┐
│                    Monorepo Structure                   │
├─────────────────────────────────────────────────────────┤
│  Shared Core (TypeScript)                              │
│  ├── Assessment Engine                                 │
│  ├── Business Logic                                    │
│  ├── Data Models                                       │
│  └── Utilities                                         │
├─────────────────────────────────────────────────────────┤
│  Platform-Specific Implementations                     │
│  ├── Web App (React + Vite) - Current                 │
│  ├── Mobile App (React Native)                        │
│  └── Shared UI Components                              │
├─────────────────────────────────────────────────────────┤
│  Management Tools                                       │
│  ├── Lerna/Nx (Monorepo management)                   │
│  ├── npm Workspaces                                    │
│  └── Shared Development Scripts                        │
└─────────────────────────────────────────────────────────┘
```

## Mobile Framework Comparison & Recommendation

### Option Analysis

| Framework | Code Reuse | Development Time | Performance | Healthcare Fit | Maintenance |
|-----------|------------|------------------|-------------|----------------|-------------|
| **Capacitor** | 90% | 2-4 weeks | Good | Excellent | Low |
| **React Native** | 70-80% | 6-12 weeks | Excellent | Excellent | Medium |
| **Flutter** | 0% | 8-12 weeks | Excellent | Excellent | Medium |
| **PWA Enhancement** | 95% | 1-2 weeks | Good | Good | Very Low |

### **Primary Recommendation: React Native**

#### Why React Native is Optimal:
1. **Maximum Code Reuse**: Leverage existing React knowledge and components
2. **Native Performance**: Critical for precise audio timing in cognitive assessments
3. **Healthcare Industry Proven**: Used by major medical applications
4. **Single Development Team**: Same React developers can work on both platforms
5. **Mature Ecosystem**: Extensive library support for healthcare needs

#### Secondary Recommendation: Capacitor (Quick Path)
- **Best for**: Rapid mobile deployment with minimal changes
- **Use case**: If time-to-market is critical for healthcare rollout

## Detailed Implementation Plan

### Phase 1: Project Restructuring (Week 1-2)

#### 1.1 Create Monorepo Structure
```bash
# New project structure
memory-match-assessment/
├── packages/
│   ├── core/                    # Shared TypeScript business logic
│   ├── shared-ui/              # Platform-agnostic UI components
│   ├── web/                    # Current React app (migrated)
│   └── mobile/                 # New React Native app
├── apps/
│   ├── web-deployment/         # Web build configuration
│   └── mobile-deployment/      # Mobile build configuration
├── tools/
│   ├── scripts/               # Shared development scripts
│   └── configs/               # Shared configurations
└── docs/                      # Documentation
```

#### 1.2 Setup Monorepo Management
```json
{
  "name": "memory-match-assessment",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "devDependencies": {
    "lerna": "^7.0.0",
    "@nx/js": "^16.0.0",
    "concurrently": "^8.0.0"
  },
  "scripts": {
    "dev:web": "npm run dev --workspace=packages/web",
    "dev:mobile": "npm run start --workspace=packages/mobile",
    "dev:both": "concurrently \"npm run dev:web\" \"npm run dev:mobile\"",
    "build:all": "npm run build --workspaces",
    "test:all": "npm run test --workspaces",
    "lint:all": "npm run lint --workspaces"
  }
}
```

### Phase 2: Extract Shared Core (Week 2-3)

#### 2.1 Core Business Logic Package
```typescript
// packages/core/src/types/assessment.ts
export interface AssessmentSession {
  id: string;
  patientId?: string;
  operatorId: string;
  startTime: Date;
  endTime?: Date;
  playedSounds: SoundType[];
  selectedSounds: SoundType[];
  accuracy: number;
  reactionTime: number;
  phase: AssessmentPhase;
}

export enum SoundType {
  DOG_BARK = 'dogBark',
  BELL_RING = 'bellRing',
  WATER_DROP = 'waterDrop',
  BIRD_CHIRP = 'birdChirp',
  CAR_HORN = 'carHorn',
  PHONE_RING = 'phoneRing'
}

export enum AssessmentPhase {
  SETUP = 'setup',
  INSTRUCTIONS = 'instructions',
  LISTENING = 'listening',
  DELAY = 'delay',
  SELECTION = 'selection',
  RESULTS = 'results'
}
```

#### 2.2 Assessment Engine
```typescript
// packages/core/src/services/AssessmentEngine.ts
export class AssessmentEngine {
  private session: AssessmentSession;
  private audioService: AudioService;
  private dataManager: DataManager;

  constructor(audioService: AudioService, dataManager: DataManager) {
    this.audioService = audioService;
    this.dataManager = dataManager;
  }

  async startAssessment(operatorId: string, patientId?: string): Promise<string> {
    this.session = {
      id: this.generateId(),
      operatorId,
      patientId,
      startTime: new Date(),
      playedSounds: [],
      selectedSounds: [],
      accuracy: 0,
      reactionTime: 0,
      phase: AssessmentPhase.SETUP
    };

    await this.dataManager.saveSession(this.session);
    return this.session.id;
  }

  async playListeningPhase(): Promise<SoundType[]> {
    const sounds = this.selectRandomSounds(3);
    this.session.playedSounds = sounds;
    this.session.phase = AssessmentPhase.LISTENING;

    // Play sounds with 1.5-second intervals
    for (let i = 0; i < sounds.length; i++) {
      await this.audioService.playSound(sounds[i]);
      if (i < sounds.length - 1) {
        await this.delay(1500);
      }
    }

    return sounds;
  }

  async startDelayPhase(): Promise<void> {
    this.session.phase = AssessmentPhase.DELAY;
    await this.delay(6000); // Clinical standard 6-second delay
  }

  calculateResults(selectedSounds: SoundType[], reactionTime: number): AssessmentResult {
    const accuracy = this.calculateAccuracy(selectedSounds);
    this.session.selectedSounds = selectedSounds;
    this.session.accuracy = accuracy;
    this.session.reactionTime = reactionTime;
    this.session.endTime = new Date();
    this.session.phase = AssessmentPhase.RESULTS;

    const result = {
      accuracy,
      reactionTime,
      passed: accuracy >= 0.6, // 60% threshold per clinical requirements
      session: this.session
    };

    this.dataManager.saveSession(this.session);
    return result;
  }

  private calculateAccuracy(selected: SoundType[]): number {
    const correct = selected.filter(sound => 
      this.session.playedSounds.includes(sound)
    ).length;
    return correct / this.session.playedSounds.length;
  }

  private selectRandomSounds(count: number): SoundType[] {
    const allSounds = Object.values(SoundType);
    const shuffled = [...allSounds].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
```

### Phase 3: Platform-Specific Audio Services (Week 3-4)

#### 3.1 Abstract Audio Service
```typescript
// packages/core/src/services/AudioService.ts
export abstract class AudioService {
  abstract playSound(soundType: SoundType): Promise<void>;
  abstract setVolume(volume: number): void;
  abstract preloadSounds(): Promise<void>;
  abstract cleanup(): void;
}

export interface AudioConfig {
  volume: number;
  sampleRate: number;
  bufferSize: number;
}
```

#### 3.2 Web Audio Implementation
```typescript
// packages/web/src/services/WebAudioService.ts
import { AudioService, SoundType, AudioConfig } from '@memory-match/core';

export class WebAudioService extends AudioService {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private soundCache: Map<SoundType, AudioBuffer> = new Map();

  constructor(config: AudioConfig) {
    super();
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = config.volume;
  }

  async playSound(soundType: SoundType): Promise<void> {
    let audioBuffer = this.soundCache.get(soundType);
    
    if (!audioBuffer) {
      audioBuffer = await this.generateSound(soundType);
      this.soundCache.set(soundType, audioBuffer);
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);
    source.start();

    return new Promise(resolve => {
      source.onended = () => resolve();
    });
  }

  private async generateSound(soundType: SoundType): Promise<AudioBuffer> {
    // Your existing Web Audio API sound generation logic
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.0;
    const frameCount = sampleRate * duration;
    const audioBuffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const output = audioBuffer.getChannelData(0);

    switch (soundType) {
      case SoundType.DOG_BARK:
        return this.generateDogBark(output, sampleRate);
      case SoundType.BELL_RING:
        return this.generateBellRing(output, sampleRate);
      // ... implement other sounds
      default:
        throw new Error(`Unknown sound type: ${soundType}`);
    }
  }

  setVolume(volume: number): void {
    this.gainNode.gain.value = volume;
  }

  async preloadSounds(): Promise<void> {
    const promises = Object.values(SoundType).map(async (soundType) => {
      const audioBuffer = await this.generateSound(soundType);
      this.soundCache.set(soundType, audioBuffer);
    });
    await Promise.all(promises);
  }

  cleanup(): void {
    this.audioContext.close();
  }
}
```

#### 3.3 Mobile Audio Implementation
```typescript
// packages/mobile/src/services/MobileAudioService.ts
import { Audio } from 'expo-av';
import { AudioService, SoundType, AudioConfig } from '@memory-match/core';

export class MobileAudioService extends AudioService {
  private soundObjects: Map<SoundType, Audio.Sound> = new Map();
  private volume: number = 1.0;

  constructor(config: AudioConfig) {
    super();
    this.volume = config.volume;
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false
    });
  }

  async playSound(soundType: SoundType): Promise<void> {
    let sound = this.soundObjects.get(soundType);
    
    if (!sound) {
      sound = new Audio.Sound();
      const soundUri = this.getSoundUri(soundType);
      await sound.loadAsync({ uri: soundUri });
      await sound.setVolumeAsync(this.volume);
      this.soundObjects.set(soundType, sound);
    }

    await sound.replayAsync();
  }

  private getSoundUri(soundType: SoundType): string {
    // For React Native, you might use pre-generated audio files
    // or implement real-time generation using react-native-audio
    const soundMap = {
      [SoundType.DOG_BARK]: require('../assets/sounds/dog_bark.wav'),
      [SoundType.BELL_RING]: require('../assets/sounds/bell_ring.wav'),
      [SoundType.WATER_DROP]: require('../assets/sounds/water_drop.wav'),
      [SoundType.BIRD_CHIRP]: require('../assets/sounds/bird_chirp.wav'),
      [SoundType.CAR_HORN]: require('../assets/sounds/car_horn.wav'),
      [SoundType.PHONE_RING]: require('../assets/sounds/phone_ring.wav')
    };
    return soundMap[soundType];
  }

  async setVolume(volume: number): Promise<void> {
    this.volume = volume;
    for (const [, sound] of this.soundObjects) {
      await sound.setVolumeAsync(volume);
    }
  }

  async preloadSounds(): Promise<void> {
    const promises = Object.values(SoundType).map(async (soundType) => {
      const sound = new Audio.Sound();
      const soundUri = this.getSoundUri(soundType);
      await sound.loadAsync({ uri: soundUri });
      await sound.setVolumeAsync(this.volume);
      this.soundObjects.set(soundType, sound);
    });
    await Promise.all(promises);
  }

  cleanup(): void {
    this.soundObjects.forEach(async (sound) => {
      await sound.unloadAsync();
    });
    this.soundObjects.clear();
  }
}
```

### Phase 4: Shared UI Components (Week 4-5)

#### 4.1 Platform-Agnostic Component Interfaces
```typescript
// packages/shared-ui/src/types/components.ts
import { SoundType } from '@memory-match/core';

export interface SoundButtonProps {
  soundType: SoundType;
  onPress: (soundType: SoundType) => void;
  isSelected?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  testID?: string;
}

export interface AssessmentTimerProps {
  duration: number;
  onComplete: () => void;
  isActive: boolean;
}

export interface ResultsDisplayProps {
  accuracy: number;
  reactionTime: number;
  passed: boolean;
  onRestart: () => void;
  onExport: () => void;
}
```

#### 4.2 Shared Business Logic Hooks
```typescript
// packages/shared-ui/src/hooks/useAssessment.ts
import { useState, useCallback, useRef } from 'react';
import { 
  AssessmentEngine, 
  AssessmentPhase, 
  SoundType, 
  AudioService,
  DataManager 
} from '@memory-match/core';

export const useAssessment = (
  audioService: AudioService,
  dataManager: DataManager
) => {
  const engineRef = useRef(new AssessmentEngine(audioService, dataManager));
  const [phase, setPhase] = useState<AssessmentPhase>(AssessmentPhase.SETUP);
  const [playedSounds, setPlayedSounds] = useState<SoundType[]>([]);
  const [selectedSounds, setSelectedSounds] = useState<SoundType[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectionStartTime, setSelectionStartTime] = useState<number>(0);

  const startAssessment = useCallback(async (operatorId: string, patientId?: string) => {
    const id = await engineRef.current.startAssessment(operatorId, patientId);
    setSessionId(id);
    setPhase(AssessmentPhase.INSTRUCTIONS);
    return id;
  }, []);

  const startListeningPhase = useCallback(async () => {
    setPhase(AssessmentPhase.LISTENING);
    const sounds = await engineRef.current.playListeningPhase();
    setPlayedSounds(sounds);
    
    // Start delay phase
    await engineRef.current.startDelayPhase();
    setPhase(AssessmentPhase.SELECTION);
    setSelectionStartTime(Date.now());
  }, []);

  const selectSound = useCallback((soundType: SoundType) => {
    setSelectedSounds(prev => {
      if (prev.includes(soundType)) {
        return prev.filter(s => s !== soundType);
      } else if (prev.length < 3) {
        return [...prev, soundType];
      }
      return prev;
    });
  }, []);

  const submitSelection = useCallback(() => {
    if (selectedSounds.length !== 3) return null;
    
    const reactionTime = Date.now() - selectionStartTime;
    const results = engineRef.current.calculateResults(selectedSounds, reactionTime);
    setPhase(AssessmentPhase.RESULTS);
    return results;
  }, [selectedSounds, selectionStartTime]);

  const resetAssessment = useCallback(() => {
    setPhase(AssessmentPhase.SETUP);
    setPlayedSounds([]);
    setSelectedSounds([]);
    setSessionId(null);
    setSelectionStartTime(0);
  }, []);

  return {
    phase,
    playedSounds,
    selectedSounds,
    sessionId,
    startAssessment,
    startListeningPhase,
    selectSound,
    submitSelection,
    resetAssessment,
    canSubmit: selectedSounds.length === 3
  };
};
```

### Phase 5: React Native Implementation (Week 5-8)

#### 5.1 React Native Project Setup
```bash
# Create React Native project with Expo
npx create-expo-app@latest packages/mobile --template

# Install dependencies
cd packages/mobile
npx expo install expo-av expo-file-system expo-secure-store
npm install @memory-match/core @memory-match/shared-ui
```

#### 5.2 React Native Main App Component
```typescript
// packages/mobile/src/App.tsx
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AssessmentPhase } from '@memory-match/core';
import { useAssessment } from '@memory-match/shared-ui';
import { MobileAudioService } from './services/MobileAudioService';
import { MobileDataManager } from './services/MobileDataManager';
import { 
  SetupScreen, 
  InstructionsScreen, 
  ListeningScreen, 
  DelayScreen, 
  SelectionScreen, 
  ResultsScreen 
} from './screens';

const audioService = new MobileAudioService({ volume: 0.8, sampleRate: 44100, bufferSize: 4096 });
const dataManager = new MobileDataManager();

export default function App() {
  const assessment = useAssessment(audioService, dataManager);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      await audioService.preloadSounds();
      setIsLoading(false);
    };
    
    initializeApp();
    
    return () => {
      audioService.cleanup();
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderCurrentPhase = () => {
    switch (assessment.phase) {
      case AssessmentPhase.SETUP:
        return <SetupScreen onStart={assessment.startAssessment} />;
      
      case AssessmentPhase.INSTRUCTIONS:
        return <InstructionsScreen onContinue={assessment.startListeningPhase} />;
      
      case AssessmentPhase.LISTENING:
        return <ListeningScreen sounds={assessment.playedSounds} />;
      
      case AssessmentPhase.DELAY:
        return <DelayScreen duration={6} />;
      
      case AssessmentPhase.SELECTION:
        return (
          <SelectionScreen
            selectedSounds={assessment.selectedSounds}
            onSoundSelect={assessment.selectSound}
            onSubmit={assessment.submitSelection}
            canSubmit={assessment.canSubmit}
          />
        );
      
      case AssessmentPhase.RESULTS:
        return (
          <ResultsScreen
            onRestart={assessment.resetAssessment}
            onExport={() => {/* implement export */}}
          />
        );
      
      default:
        return <SetupScreen onStart={assessment.startAssessment} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {renderCurrentPhase()}
    </SafeAreaProvider>
  );
}
```

## Development Workflow

### Daily Development Commands
```bash
# Start both platforms simultaneously
npm run dev:both

# Individual platform development
npm run dev:web      # Web development
npm run dev:mobile   # Mobile development (Expo)

# Testing
npm run test:all     # Run all tests
npm run lint:all     # Lint all packages

# Building
npm run build:all    # Build all packages
```

### Cross-Platform Testing Strategy
```bash
# Web testing
npm run dev:web
# Open http://localhost:3000 on desktop
# Open http://[your-ip]:3000 on mobile browser

# Mobile app testing
npm run dev:mobile
# Scan QR code with Expo Go app
# Test on iOS/Android devices

# Automated testing
npm run test:core         # Test shared business logic
npm run test:web          # Test web-specific components
npm run test:mobile       # Test mobile-specific components
```

## Healthcare-Specific Considerations

### Clinical Compliance Features
- **Standardized Timing**: Consistent 1.5s intervals and 6s delays across platforms
- **Data Integrity**: Encrypted local storage and secure data export
- **Accessibility**: WCAG 2.1 AA compliance for elderly and impaired patients
- **Audit Trail**: Complete logging of all assessment interactions
- **Performance Monitoring**: Alert system for cognitive decline detection

### Security Implementation
- **Data Encryption**: All patient data encrypted at rest and in transit
- **Authentication**: Biometric authentication for healthcare workers
- **HIPAA Compliance**: Privacy controls and audit logging
- **Offline Operation**: Full functionality without internet dependency

## Deployment Strategy

### Web Deployment
```bash
# Build optimized web version
npm run build --workspace=packages/web

# Deploy to healthcare servers
# Static hosting (Netlify, Vercel) or
# Self-hosted for HIPAA compliance
```

### Mobile Deployment
```bash
# iOS App Store
npm run build:ios --workspace=packages/mobile
# Submit through App Store Connect

# Google Play Store
npm run build:android --workspace=packages/mobile
# Submit through Google Play Console

# Enterprise Distribution
# Side-loading for healthcare institutions
```

## Maintenance & Scaling Plan

### Code Maintenance Benefits
- **Single Source of Truth**: Business logic changes update both platforms
- **Consistent Updates**: Feature parity maintained automatically
- **Reduced Testing**: Core logic tested once, used everywhere
- **Developer Efficiency**: Same team maintains both platforms

### Future Enhancement Roadmap
1. **Phase 1** (Months 1-3): Complete dual-platform implementation
2. **Phase 2** (Months 4-6): Advanced analytics and reporting
3. **Phase 3** (Months 7-9): Integration with Electronic Health Records
4. **Phase 4** (Months 10-12): Multi-language support and global deployment

## Cost-Benefit Analysis

### Development Costs
| Approach | Initial Development | Annual Maintenance | Platform Consistency |
|----------|-------------------|-------------------|---------------------|
| **Recommended Monorepo** | High (3-4 months) | Low | Excellent |
| **Separate Codebases** | Medium (2-3 months) | High | Poor |
| **Web-Only** | Low (current) | Very Low | Limited |

### Healthcare ROI
- **Faster Clinical Deployment**: Single development cycle for both platforms
- **Reduced Training Costs**: Consistent interface across devices
- **Better Patient Compliance**: Native mobile experience improves engagement
- **Scalable Architecture**: Easy to add new assessment modules

## Conclusion

The recommended monorepo architecture with React (web) + React Native (mobile) + shared TypeScript core provides the optimal balance of:

- **Code Reuse**: 70-80% shared codebase
- **Performance**: Native mobile performance with web flexibility
- **Maintainability**: Single team, unified development workflow
- **Healthcare Compliance**: Consistent behavior across platforms
- **Future-Proofing**: Scalable architecture for additional assessment tools

This strategy ensures your Memory Match cognitive assessment tool can serve healthcare providers across all platforms while maintaining the clinical precision and reliability required for medical applications.

---

*Prepared for Memory Match Cognitive Assessment Tool Development Team*  
*Date: August 5, 2025*
