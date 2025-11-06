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

  const register = async (email: string, username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.register(email, username, password);
      
      // Store auth data
      storage.setToken(response.token);
      storage.setUser(response.user);
      
      // Update state
      setUser(response.user);
      setIsAuthenticated(true);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.login(email, password);
      
      // Store auth data
      storage.setToken(response.token);
      storage.setUser(response.user);
      
      // Update state
      setUser(response.user);
      setIsAuthenticated(true);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    storage.clearAuth();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      // Fetch fresh user data if needed
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
    register,
    login,
    logout,
    refreshUser,
  };
};
