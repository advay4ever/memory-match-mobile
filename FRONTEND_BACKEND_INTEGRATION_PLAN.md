# Frontend-Backend Integration Plan
## Memory Match Mobile Game

This document outlines the complete plan for integrating the React/TypeScript frontend with the Flask Python backend.

---

## 🎯 **Overview**

**Frontend:** React + TypeScript + Vite (Mobile Web App)  
**Backend:** Flask + SQLAlchemy + SQLite  
**Communication:** RESTful API over HTTP/HTTPS with JSON  
**Authentication:** Google OAuth 2.0 + Username fallback

---

## 📋 **Table of Contents**

1. [Architecture Overview](#architecture-overview)
2. [Data Flow](#data-flow)
3. [Frontend Components Strategy](#frontend-components-strategy)
4. [API Integration Layer](#api-integration-layer)
5. [State Management](#state-management)
6. [User Journey & Workflow](#user-journey--workflow)
7. [Implementation Steps](#implementation-steps)
8. [Code Examples](#code-examples)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Considerations](#deployment-considerations)

---

## 1. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (User Device)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         React Frontend (Vite + TypeScript)         │    │
│  │                                                     │    │
│  │  Authentication:                                    │    │
│  │  ├─ Google Sign-In Button (@react-oauth/google)    │    │
│  │  └─ Username Input (Fallback)                      │    │
│  │                                                     │    │
│  │  ├─ Game UI Components                             │    │
│  │  ├─ User Profile Components                        │    │
│  │  ├─ Statistics Dashboard                           │    │
│  │  ├─ History View                                   │    │
│  │  └─ API Client Layer                               │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
              ┌───────┴────────┐
              │                │
         OAuth Flow     REST API Calls
              │                │
      ┌───────▼────────┐       │
      │  Google OAuth  │       │
      │   Servers      │       │
      └───────┬────────┘       │
              │ ID Token       │
              └────────┬───────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│              Flask Backend Server (Port 5001)                │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Authentication Endpoints               │    │
│  │  ├─ POST /api/auth/google (Verify Google token)    │    │
│  │  └─ POST /api/auth/username (Username fallback)    │    │
│  ├──────────────────────────────────────────────────────┤   │
│  │                  API Endpoints                      │    │
│  │  ├─ /api/users (POST, GET)                         │    │
│  │  ├─ /api/results (POST)                            │    │
│  │  ├─ /api/results/user/:id (GET)                    │    │
│  │  └─ /api/results/user/:id/stats (GET)              │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │            SQLite Database                          │   │
│  │  users table:                                       │   │
│  │  ├─ id, username, auth_provider                     │   │
│  │  ├─ provider_id, email, display_name                │   │
│  │  └─ avatar_url, created_at, last_login              │   │
│  │                                                      │   │
│  │  game_results table (unchanged)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow

### Complete User Flow

```
User Opens App
      │
      ▼
┌─────────────────────┐
│   Check Local       │ (localStorage for auth token & user)
│   Storage           │
└─────┬───────────────┘
      │
      ├─── Token Found? ──── Yes ──→ Validate Token ──→ Load User Data ──→ Start Game
      │
      └─── No ──→ Show Login Screen
                        │
                  ┌─────┴──────┐
                  │            │
           Google Sign-In   Username Input
                  │            │
                  ▼            ▼
          Get Google     POST /api/auth/username
           ID Token           │
                  │            │
                  ▼            │
        POST /api/auth/google  │
        (Verify token with     │
         Google servers)       │
                  │            │
                  └─────┬──────┘
                        │
                        ▼
              Backend creates/finds user
              Returns { user, jwt_token }
                        │
                        ▼
              Save JWT + User to localStorage
                        │
                        ▼
                    Start Game
                        │
                        ▼
              ┌─────────────────────┐
              │   User Plays Game   │
              └─────────┬───────────┘
                        │
                        ▼
                  Game Completes
                        │
                        ▼
              POST /api/results
              (Save Game Result)
              [Includes JWT in Authorization header]
                        │
                        ▼
              ┌─────────────────────┐
              │  Show Results       │
              │  - Score            │
              │  - Time             │
              │  - Moves            │
              └─────────┬───────────┘
                        │
                        ├──→ View Stats ──→ GET /api/results/user/:id/stats
                        │
                        └──→ View History ──→ GET /api/results/user/:id
```

---

## 3. Frontend Components Strategy

### Component Architecture

```
App.tsx
│
├─── GoogleOAuthProvider (Wraps entire app)
│
├─── AppProvider (Context for user & game state)
│
├─── Router
│    │
│    ├─── LoginScreen
│    │    ├─── GoogleLoginButton (Primary)
│    │    └─── UsernameLoginForm (Fallback)
│    │
│    ├─── GameScreen
│    │    ├─── GameBoard (Card grid)
│    │    ├─── GameStats (Score, Moves, Timer)
│    │    └─── GameControls (New Game, Difficulty)
│    │
│    ├─── ResultsScreen
│    │    ├─── GameSummary (Current game results)
│    │    └─── ActionButtons (Play Again, View Stats)
│    │
│    ├─── ProfileScreen
│    │    ├─── UserInfo (Avatar, name, email)
│    │    ├─── StatsDisplay (Overall statistics)
│    │    └─── GameHistory (List of past games)
│    │
│    └─── SettingsScreen
│         ├─── DifficultySelector
│         └─── LogoutButton
│
└─── Services
     ├─── api.ts (API client)
     ├─── auth.ts (Auth helpers)
     ├─── storage.ts (LocalStorage helpers)
     └─── types.ts (TypeScript interfaces)
```

### Key Components Breakdown

#### **1. LoginScreen Component**
```typescript
// Responsibilities:
// - Show Google Sign-In button (primary)
// - Show username input (fallback)
// - Handle Google OAuth flow
// - Call appropriate auth endpoints
// - Store JWT token and user data
// - Redirect to game

State:
- loading: boolean
- error: string | null
- showUsernameLogin: boolean

API Calls:
- loginWithGoogle(idToken) → POST /api/auth/google
- loginWithUsername(username) → POST /api/auth/username
```

#### **2. GameScreen Component**
```typescript
// Responsibilities:
// - Render game board
// - Track moves, time, score
// - Handle game logic
// - Save result when complete

State:
- cards: Card[]
- score: number
- moves: number
- timeElapsed: number
- gameStarted: boolean
- gameCompleted: boolean

API Calls:
- saveGameResult(data) → POST /api/results (on game complete)
```

#### **3. ResultsScreen Component**
```typescript
// Responsibilities:
// - Display game results
// - Show comparison to previous games
// - Provide navigation options

Props:
- gameResult: GameResult

State:
- stats: UserStats | null

API Calls:
- getUserStats(userId) → GET /api/results/user/:id/stats
```

#### **4. ProfileScreen Component**
```typescript
// Responsibilities:
// - Display user info
// - Show overall statistics
// - List recent games

State:
- user: User
- stats: UserStats
- history: GameResult[]
- loading: boolean

API Calls:
- getUserStats(userId) → GET /api/results/user/:id/stats
- getUserHistory(userId, limit) → GET /api/results/user/:id?limit=10
```

---

## 4. API Integration Layer

### File Structure

```
src/
├── services/
│   ├── api.ts           # API client with all endpoints
│   ├── auth.ts          # Authentication helpers
│   ├── types.ts         # TypeScript interfaces
│   └── storage.ts       # LocalStorage helpers (token + user)
├── hooks/
│   ├── useAuth.ts       # Authentication hook (Google + Username)
│   ├── useGameResult.ts # Game result hook
│   └── useStats.ts      # Statistics hook
└── context/
    └── AppContext.tsx   # Global app state
```

### API Client Implementation

**Dependencies needed:**
```bash
npm install @react-oauth/google jwt-decode
```

Create `src/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export class MemoryMatchAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Helper to get auth token
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Helper for making requests
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Authentication endpoints
  async authGoogle(idToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    });
  }

  async authUsername(username: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/username', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  // User endpoints
  async createUser(username: string): Promise<User> {
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async getUser(username: string): Promise<User> {
    return this.request<User>(`/api/users/${username}`);
  }

  async getAllUsers(): Promise<User[]> {
    return this.request<User[]>('/api/users');
  }

  // Game results endpoints
  async saveGameResult(data: CreateGameResultRequest): Promise<GameResult> {
    return this.request<GameResult>('/api/results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserHistory(
    userId: number,
    options?: { limit?: number; difficulty?: string }
  ): Promise<UserHistoryResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.difficulty) params.append('difficulty', options.difficulty);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<UserHistoryResponse>(`/api/results/user/${userId}${query}`);
  }

  async getUserStats(userId: number): Promise<UserStatsResponse> {
    return this.request<UserStatsResponse>(`/api/results/user/${userId}/stats`);
  }
}

export const api = new MemoryMatchAPI();
```

---

## 5. State Management

### Option 1: React Context (Recommended for MVP)

```typescript
// src/context/AppContext.tsx

interface AppState {
  user: User | null;
  currentGame: GameData | null;
  stats: UserStats | null;
}

interface AppContextValue extends AppState {
  setUser: (user: User | null) => void;
  startGame: (difficulty: string, gridSize: string) => void;
  endGame: (score: number, moves: number, time: number) => Promise<void>;
  loadStats: () => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    user: null,
    currentGame: null,
    stats: null,
  });

  const setUser = (user: User | null) => {
    setState(prev => ({ ...prev, user }));
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  };

  const startGame = (difficulty: string, gridSize: string) => {
    setState(prev => ({
      ...prev,
      currentGame: {
        difficulty,
        gridSize,
        startTime: Date.now(),
      }
    }));
  };

  const endGame = async (score: number, moves: number, time: number) => {
    if (!state.user || !state.currentGame) return;

    const result = await api.saveGameResult({
      user_id: state.user.id,
      score,
      moves,
      time_taken: time,
      difficulty: state.currentGame.difficulty,
      grid_size: state.currentGame.gridSize,
    });

    setState(prev => ({ ...prev, currentGame: null }));
    await loadStats();
  };

  const loadStats = async () => {
    if (!state.user) return;
    
    const statsData = await api.getUserStats(state.user.id);
    setState(prev => ({ ...prev, stats: statsData.stats }));
  };

  return (
    <AppContext.Provider value={{ ...state, setUser, startGame, endGame, loadStats }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
```

### Option 2: Zustand (Alternative - Simpler)

```typescript
// src/store/useStore.ts
import { create } from 'zustand';

interface AppStore {
  user: User | null;
  stats: UserStats | null;
  setUser: (user: User | null) => void;
  loadStats: (userId: number) => Promise<void>;
}

export const useStore = create<AppStore>((set) => ({
  user: null,
  stats: null,
  setUser: (user) => set({ user }),
  loadStats: async (userId) => {
    const data = await api.getUserStats(userId);
    set({ stats: data.stats });
  },
}));
```

---

## 6. User Journey & Workflow

### Detailed User Flow with API Calls

#### **A. First Time User (Google Sign-In)**

```
1. User opens app
   └─→ Check localStorage for saved auth token
       └─→ None found

2. Show LoginScreen with Google Sign-In button
   └─→ User clicks "Sign in with Google"

3. Google OAuth popup opens
   └─→ User selects Google account
   └─→ User grants permissions (email, profile)
   └─→ Google returns ID token to frontend

4. Send token to backend
   └─→ API: POST /api/auth/google { "id_token": "eyJhbG..." }
   └─→ Backend verifies token with Google servers
   └─→ Backend creates/finds user from Google ID
   └─→ Response: { 
         "user": { 
           "id": 1, 
           "username": "alice_gmail", 
           "email": "alice@gmail.com",
           "display_name": "Alice Smith",
           "avatar_url": "https://...",
           "auth_provider": "google"
         },
         "token": "eyJhbGciOiJIUzI1NiIs..." (JWT)
       }
   └─→ Save JWT + User to localStorage
   └─→ Save to Context/State

5. Navigate to GameScreen
   └─→ User selects difficulty: "medium"
   └─→ User selects grid: "4x4"
   └─→ Start game timer

6. User plays game
   └─→ Track: moves, time, matched pairs
   └─→ Calculate score

7. Game completes
   └─→ API: POST /api/results {
       "user_id": 1,
       "score": 1500,
       "moves": 25,
       "time_taken": 180,
       "difficulty": "medium",
       "grid_size": "4x4"
     }
     Headers: { "Authorization": "Bearer eyJhbG..." }
   └─→ Response: Saved game result

8. Navigate to ResultsScreen
   └─→ API: GET /api/results/user/1/stats
   └─→ Show current game + overall stats
   └─→ Show user's Google profile picture
   └─→ Options: Play Again | View Profile
```

#### **B. First Time User (Username Fallback)**

```
1. User opens app
   └─→ Check localStorage for saved auth token
       └─→ None found

2. Show LoginScreen
   └─→ User clicks "Continue with Username" (fallback option)

3. Username input shown
   └─→ User enters "charlie"

4. Submit username
   └─→ API: POST /api/auth/username { "username": "charlie" }
   └─→ Backend creates/finds user
   └─→ Response: { 
         "user": { 
           "id": 2, 
           "username": "charlie",
           "auth_provider": "username"
         },
         "token": "eyJhbGciOiJIUzI1NiIs..." (JWT)
       }
   └─→ Save JWT + User to localStorage
   └─→ [Continue from step 5 of Google flow above]
```

#### **C. Returning User**

```
1. User opens app
   └─→ Check localStorage for saved auth token
       └─→ Found: JWT token

2. Decode JWT and validate expiration
   └─→ If expired: Clear storage, show LoginScreen
   └─→ If valid: Load user data from localStorage

3. Auto-login user
   └─→ API: GET /api/results/user/:id/stats
   └─→ Show welcome back message with avatar
   └─→ "Welcome back, Alice!" with Google profile pic

4. Options shown:
   ├─→ Start New Game
   ├─→ View Profile (history + stats)
   └─→ Logout

5. User clicks "Start New Game"
   └─→ [Continue from step 5 of First Time User flow]
```

---

## 7. Implementation Steps

### Phase 1: Setup & API Integration (Week 1)

**Day 1-2: Project Setup**
- [ ] Install Google OAuth dependencies: `npm install @react-oauth/google jwt-decode`
- [ ] Set up Google OAuth credentials in Google Cloud Console
- [ ] Create TypeScript interfaces in `src/services/types.ts` (with auth fields)
- [ ] Set up API client in `src/services/api.ts` (with auth endpoints)
- [ ] Create environment variables (.env file) with Google Client ID
- [ ] Test API connection with backend

**Day 3-4: Google OAuth Setup**
- [ ] Wrap app with GoogleOAuthProvider in `main.tsx`
- [ ] Create auth service in `src/services/auth.ts`
- [ ] Implement JWT token management
- [ ] Build useAuth hook with Google + Username login
- [ ] Create storage helpers for token + user data

**Day 5-7: Authentication UI**
- [ ] Build LoginScreen with Google Sign-In button
- [ ] Add username login as fallback option
- [ ] Implement auth flow (token exchange, storage, redirect)
- [ ] Test full authentication cycle
- [ ] Add logout functionality

### Phase 2: Game Integration (Week 2)

**Day 1-3: Game Logic**
- [ ] Implement game board component
- [ ] Add timer and move counter
- [ ] Calculate score logic
- [ ] Test game completion detection

**Day 4-5: Results Saving**
- [ ] Integrate POST /api/results on game end
- [ ] Handle success/error states
- [ ] Show confirmation to user

**Day 6-7: Results Display**
- [ ] Build ResultsScreen component
- [ ] Fetch and display user stats
- [ ] Show comparison with previous games

### Phase 3: User Profile & History (Week 3)

**Day 1-3: Profile Screen**
- [ ] Create ProfileScreen layout
- [ ] Display user information
- [ ] Show overall statistics
- [ ] Add visual charts/graphs

**Day 4-5: Game History**
- [ ] Fetch user's game history
- [ ] Display in list/grid format
- [ ] Add filtering (by difficulty)
- [ ] Implement pagination or "load more"

**Day 6-7: Polish & Testing**
- [ ] Error handling throughout
- [ ] Loading states for all API calls
- [ ] Offline detection
- [ ] Success/error notifications

### Phase 4: Enhancement & Optimization (Week 4)

**Day 1-2: Performance**
- [ ] Implement caching strategy
- [ ] Add optimistic UI updates
- [ ] Lazy load components

**Day 3-4: UX Improvements**
- [ ] Add animations
- [ ] Implement skeleton loaders
- [ ] Add retry logic for failed requests

**Day 5-7: Testing & Deployment**
- [ ] Write unit tests for API client
- [ ] Test offline scenarios
- [ ] Deploy frontend
- [ ] Connect to deployed backend

---

## 8. Code Examples

### Complete Implementation Examples

#### **src/services/types.ts**

```typescript
// API Response Types
export interface User {
  id: number;
  username: string;
  created_at: string;
  // Google OAuth fields
  auth_provider: 'google' | 'username';
  provider_id?: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  last_login?: string;
}

export interface AuthResponse {
  user: User;
  token: string;  // JWT token
}

export interface GameResult {
  id: number;
  user_id: number;
  score: number;
  moves: number;
  time_taken: number;
  difficulty: string;
  grid_size: string;
  completed: boolean;
  played_at: string;
}

export interface UserStats {
  total_games: number;
  average_score: number;
  average_moves: number;
  average_time: number;
  best_score: number;
  total_time_played: number;
}

export interface UserHistoryResponse {
  user: User;
  results: GameResult[];
  total_games: number;
}

export interface UserStatsResponse {
  user: User;
  stats: UserStats;
}

// Request Types
export interface CreateGameResultRequest {
  user_id: number;
  score: number;
  moves: number;
  time_taken: number;
  difficulty?: string;
  grid_size?: string;
  completed?: boolean;
}

// App Types
export interface GameData {
  difficulty: string;
  gridSize: string;
  startTime: number;
}
```

#### **src/services/storage.ts**

```typescript
import type { User } from './types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'memory_match_user';

export const storage = {
  // Auth token management
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  // User data management
  getUser(): User | null {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearUser(): void {
    localStorage.removeItem(USER_KEY);
  },

  // Clear all auth data
  clearAuth(): void {
    this.clearToken();
    this.clearUser();
  },
};
```

#### **src/services/auth.ts**

```typescript
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  user_id: number;
  exp: number;
  iat: number;
}

export const auth = {
  /**
   * Check if JWT token is valid and not expired
   */
  isTokenValid(token: string): boolean {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const now = Date.now() / 1000;
      return decoded.exp > now;
    } catch {
      return false;
    }
  },

  /**
   * Get user ID from JWT token
   */
  getUserIdFromToken(token: string): number | null {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.user_id;
    } catch {
      return null;
    }
  },

  /**
   * Get token expiration date
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  },
};
```

#### **main.tsx - Google OAuth Provider Setup**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './styles/globals.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (!GOOGLE_CLIENT_ID) {
  console.warn('Google Client ID not found. Social login will not work.');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
```

#### **src/hooks/useAuth.ts**

```typescript
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { auth } from '../services/auth';
import type { User } from '../services/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing auth on mount
    const token = storage.getToken();
    const savedUser = storage.getUser();
    
    if (token && savedUser && auth.isTokenValid(token)) {
      setUser(savedUser);
      setIsAuthenticated(true);
    } else {
      // Clear invalid/expired auth
      storage.clearAuth();
    }
    
    setLoading(false);
  }, []);

  /**
   * Login with Google ID token
   */
  const loginWithGoogle = async (idToken: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.authGoogle(idToken);
      
      // Save auth data
      storage.setToken(response.token);
      storage.setUser(response.user);
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      return response.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with username (fallback)
   */
  const loginWithUsername = async (username: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.authUsername(username);
      
      // Save auth data
      storage.setToken(response.token);
      storage.setUser(response.user);
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      return response.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    storage.clearAuth();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  /**
   * Refresh user data from backend
   */
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      // Fetch fresh user data if needed
      // This could call GET /api/users/:username
      const userData = await api.getUser(user.username);
      storage.setUser(userData);
      setUser(userData);
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    loginWithGoogle,
    loginWithUsername,
    logout,
    refreshUser,
  };
};
```

#### **src/hooks/useGameResult.ts**

```typescript
import { useState } from 'react';
import { api } from '../services/api';
import type { GameResult, CreateGameResultRequest } from '../services/types';

export const useGameResult = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveResult = async (data: CreateGameResultRequest): Promise<GameResult> => {
    setSaving(true);
    setError(null);
    
    try {
      const result = await api.saveGameResult(data);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save result';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { saveResult, saving, error };
};
```

#### **src/components/LoginScreen.tsx**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';

export const LoginScreen = () => {
  const [showUsernameLogin, setShowUsernameLogin] = useState(false);
  const [username, setUsername] = useState('');
  const { loginWithGoogle, loginWithUsername, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/game');
    } catch (err) {
      console.error('Google login failed:', err);
    }
  };

  const handleGoogleError = () => {
    console.error('Google Sign-In failed');
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) return;

    try {
      await loginWithUsername(username.trim());
      navigate('/game');
    } catch (err) {
      console.error('Username login failed:', err);
    }
  };

  return (
    <div className="login-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2">Memory Match</h1>
        <p className="text-gray-600 text-center mb-8">
          Sign in to save your progress and compete!
        </p>

        {/* Google Sign-In */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="filled_blue"
            size="large"
            text="continue_with"
            shape="rectangular"
          />
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        {/* Username Login (Fallback) */}
        {!showUsernameLogin ? (
          <button
            onClick={() => setShowUsernameLogin(true)}
            className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Continue with Username
          </button>
        ) : (
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={80}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Signing in...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Privacy Note */}
        <p className="text-xs text-gray-500 text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
```



#### **src/components/GameScreen.tsx**

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGameResult } from '../hooks/useGameResult';

export const GameScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const { saveResult } = useGameResult();
  const navigate = useNavigate();
  
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Timer
  useEffect(() => {
    if (!gameStarted || gameCompleted) return;
    
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameStarted, gameCompleted]);

  const handleGameComplete = async () => {
    if (!user) return;
    
    setGameCompleted(true);
    
    try {
      await saveResult({
        user_id: user.id,
        score,
        moves,
        time_taken: timeElapsed,
        difficulty: 'medium', // Get from game settings
        grid_size: '4x4',     // Get from game settings
      });
      
      navigate('/results', { state: { score, moves, timeElapsed } });
    } catch (err) {
      console.error('Failed to save game:', err);
      // Still navigate but show error
      navigate('/results', { state: { score, moves, timeElapsed, saveError: true } });
    }
  };

  // Game logic here...

  return (
    <div className="game-screen">
      {/* User Info with Avatar */}
      <div className="user-bar flex items-center justify-between p-4 bg-white shadow">
        <div className="flex items-center gap-3">
          {user?.avatar_url && (
            <img 
              src={user.avatar_url} 
              alt={user.display_name || user.username}
              className="w-10 h-10 rounded-full"
            />
          )}
          <span className="font-medium">
            {user?.display_name || user?.username}
          </span>
        </div>
        <div className="game-stats flex gap-4">
          <span>Score: {score}</span>
          <span>Moves: {moves}</span>
          <span>Time: {timeElapsed}s</span>
        </div>
      </div>
      
      {/* Game board component */}
      
      {gameCompleted && <p>Saving result...</p>}
    </div>
  );
};
```

#### **src/components/ProfileScreen.tsx**

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { UserStats, GameResult } from '../services/types';

export const ProfileScreen = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!user) return;

    const loadData = async () => {
      try {
        const [statsData, historyData] = await Promise.all([
          api.getUserStats(user.id),
          api.getUserHistory(user.id, { limit: 10 }),
        ]);
        
        setStats(statsData.stats);
        setHistory(historyData.results);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="profile-screen max-w-4xl mx-auto p-6">
      {/* User Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user?.avatar_url && (
              <img 
                src={user.avatar_url} 
                alt={user.display_name || user.username}
                className="w-20 h-20 rounded-full border-4 border-purple-500"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {user?.display_name || user?.username}
              </h2>
              {user?.email && (
                <p className="text-gray-600">{user.email}</p>
              )}
              <p className="text-sm text-gray-500">
                {user?.auth_provider === 'google' ? '🔵 Google Account' : '👤 Username Account'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Total Games</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.total_games}</p>
        </div>
        <div className="stat-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Best Score</h3>
          <p className="text-3xl font-bold text-green-600">{stats.best_score}</p>
        </div>
        <div className="stat-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Average Score</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.average_score.toFixed(1)}</p>
        </div>
        <div className="stat-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Average Moves</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.average_moves.toFixed(1)}</p>
        </div>
        <div className="stat-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Average Time</h3>
          <p className="text-3xl font-bold text-pink-600">{stats.average_time.toFixed(0)}s</p>
        </div>
        <div className="stat-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Total Time</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {Math.floor(stats.total_time_played / 60)}m
          </p>
        </div>
      </div>

      {/* Game History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Recent Games</h3>
        <div className="space-y-3">
          {history.map((game) => (
            <div 
              key={game.id} 
              className="game-card flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="flex gap-4">
                <div>
                  <span className="font-bold text-lg">Score: {game.score}</span>
                </div>
                <div className="text-gray-600">
                  <span>Moves: {game.moves}</span>
                </div>
                <div className="text-gray-600">
                  <span>Time: {game.time_taken}s</span>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  {game.difficulty}
                </span>
                <span className="text-gray-500">
                  {new Date(game.played_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 9. Testing Strategy

### Unit Tests

```typescript
// src/services/api.test.ts
import { api } from './api';

describe('MemoryMatchAPI', () => {
  it('should create a user', async () => {
    const user = await api.createUser('testuser');
    expect(user.username).toBe('testuser');
    expect(user.id).toBeDefined();
  });

  it('should save game result', async () => {
    const result = await api.saveGameResult({
      user_id: 1,
      score: 1000,
      moves: 20,
      time_taken: 120,
    });
    expect(result.score).toBe(1000);
  });
});
```

### Integration Tests

```typescript
// Test complete user flow
describe('User Flow', () => {
  it('should complete full game cycle', async () => {
    // 1. Create user
    const user = await api.createUser('flowtest');
    
    // 2. Save result
    const result = await api.saveGameResult({
      user_id: user.id,
      score: 1500,
      moves: 25,
      time_taken: 180,
    });
    
    // 3. Get stats
    const stats = await api.getUserStats(user.id);
    expect(stats.stats.total_games).toBe(1);
    expect(stats.stats.best_score).toBe(1500);
  });
});
```

---

## 10. Deployment Considerations

### Google OAuth Setup

**Prerequisites:**
1. Create a Google Cloud Project at https://console.cloud.google.com
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Configure authorized redirect URIs

**Steps:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
5. Authorized redirect URIs:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
6. Copy the Client ID to your `.env` file

### Environment Variables

Create `.env` files:

**.env.development**
```bash
# Frontend API
VITE_API_URL=http://localhost:5001

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**.env.production**
```bash
# Frontend API
VITE_API_URL=https://api.yourdomain.com

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id.apps.googleusercontent.com
```

**Backend .env**
```bash
# Database
DATABASE_URL=sqlite:///memory_match.db

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# CORS Origins
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### Build Configuration

Update `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  }
});
```

### Deployment Checklist

**Backend:**
- [ ] Update CORS settings for production domain
- [ ] Use strong JWT_SECRET_KEY (generate with `openssl rand -hex 32`)
- [ ] Verify Google OAuth Client ID is correct
- [ ] Migrate from SQLite to PostgreSQL/MySQL for production
- [ ] Set up HTTPS (required for OAuth)
- [ ] Configure environment variables on hosting platform
- [ ] Test token verification with Google

**Frontend:**
- [ ] Set production Google Client ID
- [ ] Update API_URL to production backend
- [ ] Configure authorized domains in Google Cloud Console
- [ ] Set up proper error boundaries
- [ ] Implement retry logic for failed API calls
- [ ] Add loading states for all async operations
- [ ] Handle offline scenarios
- [ ] Optimize bundle size
- [ ] Add analytics/monitoring
- [ ] Set up CI/CD pipeline

**Security:**
- [ ] HTTPS only in production (required for OAuth)
- [ ] Secure JWT secret key
- [ ] httpOnly cookies for tokens (recommended)
- [ ] CSRF protection
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (use SQLAlchemy ORM)

---

## Summary

This plan provides a complete roadmap for integrating your React frontend with the Flask backend using **Google OAuth 2.0 authentication** as the primary login method, with username login as a fallback option.

### Key Points:

1. **Google OAuth First**: Seamless one-click sign-in with Google
2. **Username Fallback**: Simple username login for users without Google accounts
3. **JWT Authentication**: Secure token-based sessions
4. **Profile Data**: Automatic name, email, and avatar from Google
5. **API-First Approach**: Build robust API client before UI
6. **State Management**: Use React Context/hooks for global state
7. **Progressive Enhancement**: Start simple, add features incrementally
8. **Error Handling**: Handle all error cases gracefully
9. **User Experience**: Loading states, profile pictures, smooth authentication
10. **Testing**: Test each integration point thoroughly

### Implementation Summary:

**Backend Changes Required:**
- Update User model with OAuth fields (auth_provider, provider_id, email, display_name, avatar_url)
- Add `google-auth` and `PyJWT` dependencies
- Create `/api/auth/google` and `/api/auth/username` endpoints
- Implement Google token verification
- Generate and verify JWT tokens
- Update database schema

**Frontend Implementation:**
- Install `@react-oauth/google` and `jwt-decode`
- Wrap app with GoogleOAuthProvider
- Create LoginScreen with Google Sign-In button
- Implement useAuth hook for authentication
- Add JWT token management
- Display user avatars and profile info
- Protected routes for authenticated users

### Authentication Flow:

```
Login Screen
    ↓
Google Sign-In Button (Primary) OR Username Input (Fallback)
    ↓
Get Google ID Token / Username
    ↓
POST /api/auth/google or /api/auth/username
    ↓
Backend verifies with Google / creates user
    ↓
Returns { user, jwt_token }
    ↓
Save to localStorage
    ↓
User authenticated → Start playing!
```

Follow the implementation phases step-by-step, and you'll have a fully integrated application with modern social authentication in 3-4 weeks!

---

### Quick Start Guide:

1. **Set up Google OAuth**: Create project in Google Cloud Console, get Client ID
2. **Update backend**: Add auth endpoints, update User model, install dependencies  
3. **Install frontend packages**: `npm install @react-oauth/google jwt-decode`
4. **Create LoginScreen**: Implement Google Sign-In button
5. **Test authentication**: Verify Google login → token → user creation
6. **Integrate with game**: Add authentication checks, display user info
7. **Deploy**: Configure production OAuth, HTTPS, environment variables

**Document Version:** 2.0  
**Last Updated:** November 3, 2025  
**Status:** Ready for Implementation with Google OAuth  
**Authentication:** Google OAuth 2.0 + Username fallback
