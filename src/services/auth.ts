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
