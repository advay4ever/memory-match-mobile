// User types
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  last_login: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
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
