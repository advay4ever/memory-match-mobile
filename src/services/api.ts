import type {
  User,
  AuthResponse,
  GameResult,
  UserHistoryResponse,
  UserStatsResponse,
  CreateGameResultRequest,
} from './types';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5001';

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

    console.log('API Request:', url, 'Base URL:', this.baseUrl); // Debug log

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Request failed');
      }

      return response.json();
    } catch (err) {
      console.error('API Fetch Error:', err);
      throw err;
    }
  }

  // Authentication
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password })
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
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
    return this.request<UserHistoryResponse>(
      `/api/results/user/${userId}${query}`
    );
  }

  async getUserStats(userId: number): Promise<UserStatsResponse> {
    return this.request<UserStatsResponse>(`/api/results/user/${userId}/stats`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export const api = new MemoryMatchAPI();
