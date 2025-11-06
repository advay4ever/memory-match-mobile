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
