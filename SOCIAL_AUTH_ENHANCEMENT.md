# Social Authentication Enhancement Plan
## Memory Match Mobile - Social Login Integration

This document extends the base integration plan to support social authentication (Google, Facebook, Apple Sign-In).

---

## 🎯 **Overview**

Add OAuth 2.0 / OpenID Connect authentication to allow users to sign in with:
- 🔵 **Google** (Google Sign-In)
- 🔵 **Facebook** (Facebook Login)
- 🍎 **Apple** (Sign in with Apple)
- 👤 **Username** (Fallback for users without social accounts)

---

## 📋 **Table of Contents**

1. [Architecture Changes](#architecture-changes)
2. [Backend Modifications](#backend-modifications)
3. [Frontend Implementation](#frontend-implementation)
4. [User Flow with Social Auth](#user-flow-with-social-auth)
5. [Security Considerations](#security-considerations)
6. [Implementation Steps](#implementation-steps)
7. [Code Examples](#code-examples)

---

## 1. Architecture Changes

### Updated System Flow

```
┌──────────────────────────────────────────────────────────┐
│                    User Device (Browser)                  │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │           React Frontend                         │    │
│  │                                                  │    │
│  │  Login Options:                                  │    │
│  │  ├─ Google Sign-In Button                       │    │
│  │  ├─ Facebook Login Button                       │    │
│  │  ├─ Apple Sign-In Button                        │    │
│  │  └─ Username Input (Fallback)                   │    │
│  │                                                  │    │
│  │  OAuth Libraries:                                │    │
│  │  ├─ @react-oauth/google                         │    │
│  │  ├─ react-facebook-login                        │    │
│  │  └─ apple-signin-auth (or backend flow)         │    │
│  └──────────────┬───────────────────────────────────┘    │
│                 │                                         │
└─────────────────┼─────────────────────────────────────────┘
                  │
                  │ OAuth Flow
                  │
         ┌────────┴─────────┐
         │                  │
    ┌────▼─────┐      ┌────▼─────┐      ┌─────────┐
    │  Google  │      │ Facebook │      │  Apple  │
    │   OAuth  │      │   OAuth  │      │  OAuth  │
    └────┬─────┘      └────┬─────┘      └────┬────┘
         │                 │                  │
         │ ID Token / Code │                  │
         └────────┬────────┴──────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Flask Backend (Port 5001)                   │
│                                                          │
│  New Endpoints:                                          │
│  ├─ POST /api/auth/google    (Verify Google token)      │
│  ├─ POST /api/auth/facebook  (Verify Facebook token)    │
│  ├─ POST /api/auth/apple     (Verify Apple token)       │
│  └─ POST /api/auth/username  (Existing username login)  │
│                                                          │
│  New Libraries:                                          │
│  ├─ google-auth (Verify Google ID tokens)               │
│  ├─ facebook-sdk (Verify Facebook tokens)               │
│  └─ apple-signin-auth (Verify Apple tokens)             │
│                                                          │
│  Updated User Model:                                     │
│  ├─ auth_provider (google/facebook/apple/username)      │
│  ├─ provider_id (unique ID from provider)               │
│  ├─ email (from social accounts)                        │
│  ├─ display_name (from social accounts)                 │
│  └─ avatar_url (profile picture URL)                    │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Backend Modifications

### Updated Database Schema

**New `users` table structure:**

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(80) UNIQUE NOT NULL,
    auth_provider VARCHAR(20) NOT NULL,  -- 'google', 'facebook', 'apple', 'username'
    provider_id VARCHAR(255),            -- Unique ID from OAuth provider
    email VARCHAR(255),                  -- Email from social account
    display_name VARCHAR(100),           -- Full name from social account
    avatar_url VARCHAR(500),             -- Profile picture URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    UNIQUE(auth_provider, provider_id)   -- Prevent duplicate social accounts
);
```

### Updated Backend Dependencies

Add to `backend/requirements.txt`:

```txt
Flask==3.0.0
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.1.1
python-dotenv==1.0.0

# Social Authentication
google-auth==2.25.0
google-auth-oauthlib==1.1.0
facebook-sdk==3.1.0
PyJWT==2.8.0
cryptography==41.0.7
requests==2.31.0
```

### New Backend Endpoints

#### **1. POST /api/auth/google**
Verify Google ID token and create/retrieve user.

```python
{
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

#### **2. POST /api/auth/facebook**
Verify Facebook access token and create/retrieve user.

```python
{
  "access_token": "EAABsbCS1iHgBO..."
}
```

#### **3. POST /api/auth/apple**
Verify Apple ID token and create/retrieve user.

```python
{
  "id_token": "eyJraWQiOiJlWGF1bm...",
  "code": "c6f7a..."
}
```

#### **4. POST /api/auth/username**
Create/retrieve user with username only (existing flow).

```python
{
  "username": "alice"
}
```

---

## 3. Frontend Implementation

### New Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "@react-oauth/google": "^0.12.1",
    "react-facebook-login": "^4.1.1",
    "jwt-decode": "^4.0.0"
  }
}
```

### Environment Variables

Update `.env`:

```bash
# API
VITE_API_URL=http://localhost:5001

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Facebook OAuth
VITE_FACEBOOK_APP_ID=your-facebook-app-id

# Apple OAuth (if using client-side flow)
VITE_APPLE_CLIENT_ID=com.yourapp.web
```

### Updated App Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginScreen.tsx        # New unified login screen
│   │   ├── GoogleLoginButton.tsx
│   │   ├── FacebookLoginButton.tsx
│   │   ├── AppleLoginButton.tsx
│   │   └── UsernameLoginForm.tsx
│   ├── GameScreen.tsx
│   ├── ProfileScreen.tsx
│   └── ResultsScreen.tsx
├── services/
│   ├── api.ts                     # Updated with auth endpoints
│   ├── auth.ts                    # New auth service
│   └── types.ts                   # Updated with auth types
└── hooks/
    └── useAuth.ts                 # New authentication hook
```

---

## 4. User Flow with Social Auth

### Complete Authentication Flow

```
User Opens App
      │
      ▼
┌─────────────────────┐
│  Check Local        │
│  Storage for Token  │
└─────┬───────────────┘
      │
      ├─── Token Found? ──── Yes ──→ Validate Token
      │                               │
      │                               ├─ Valid ──→ Auto Login ──→ Load User Data
      │                               │
      │                               └─ Invalid ──→ Show Login Screen
      │
      └─── No Token ──→ Show Login Screen
                              │
                    ┌─────────┴──────────┐
                    │  Login Options:     │
                    │  1. Google          │
                    │  2. Facebook        │
                    │  3. Apple           │
                    │  4. Username        │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         Google Flow    Facebook Flow   Apple Flow
              │               │               │
              ▼               ▼               ▼
      Get ID Token    Get Access Token  Get ID Token
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                  POST /api/auth/{provider}
                  (Backend verifies with provider)
                              │
                              ▼
                  ┌────────────────────┐
                  │ User exists?       │
                  ├─ Yes → Return user │
                  └─ No → Create user  │
                              │
                              ▼
                  Return { user, token }
                              │
                              ▼
                  Save to localStorage
                              │
                              ▼
                  Navigate to Game
```

### Social Login Flows

#### **Google Sign-In Flow**

```
1. User clicks "Sign in with Google"
2. Google OAuth popup opens
3. User selects Google account
4. Google returns ID token to frontend
5. Frontend sends ID token to backend
6. Backend verifies token with Google
7. Backend creates/retrieves user
8. Backend returns user data + JWT
9. Frontend stores JWT and user data
10. User is authenticated
```

#### **Facebook Login Flow**

```
1. User clicks "Continue with Facebook"
2. Facebook OAuth popup opens
3. User authorizes app
4. Facebook returns access token
5. Frontend sends token to backend
6. Backend verifies token with Facebook
7. Backend fetches user profile from Facebook
8. Backend creates/retrieves user
9. Backend returns user data + JWT
10. User is authenticated
```

#### **Apple Sign-In Flow**

```
1. User clicks "Sign in with Apple"
2. Apple OAuth popup opens
3. User authenticates with Face ID/Touch ID
4. Apple returns ID token and authorization code
5. Frontend sends token to backend
6. Backend verifies token with Apple
7. Backend creates/retrieves user
8. Backend returns user data + JWT
9. User is authenticated
```

---

## 5. Security Considerations

### Backend Security

1. **Token Verification**
   - Always verify OAuth tokens server-side
   - Never trust client-provided user data without verification
   - Use official provider libraries for verification

2. **JWT Authentication**
   - Issue your own JWT after verifying OAuth token
   - Set reasonable expiration (e.g., 7 days)
   - Use secure secret key (environment variable)

3. **HTTPS Required**
   - OAuth requires HTTPS in production
   - Use SSL certificates for production deployment

4. **Rate Limiting**
   - Limit authentication attempts per IP
   - Prevent brute force attacks

### Frontend Security

1. **Token Storage**
   - Store JWT in httpOnly cookie (most secure) OR
   - Store in localStorage (easier but less secure)
   - Never store sensitive tokens in regular cookies

2. **CSRF Protection**
   - Use state parameter in OAuth flow
   - Validate redirect URIs

3. **Privacy**
   - Only request necessary scopes (email, profile)
   - Show privacy policy
   - Allow account deletion

---

## 6. Implementation Steps

### Backend Setup (Days 1-3)

#### **Day 1: Database & Models**

```bash
# Install new dependencies
cd backend
source ../.venv/bin/activate
pip install google-auth google-auth-oauthlib facebook-sdk PyJWT cryptography requests
pip freeze > requirements.txt
```

Update `backend/models.py`:

```python
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    
    # Social Auth fields
    auth_provider = db.Column(db.String(20), nullable=False)  # google, facebook, apple, username
    provider_id = db.Column(db.String(255))  # OAuth provider's user ID
    email = db.Column(db.String(255))
    display_name = db.Column(db.String(100))
    avatar_url = db.Column(db.String(500))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationship
    game_results = db.relationship('GameResult', backref='user', lazy=True, cascade='all, delete-orphan')
    
    # Unique constraint for provider + provider_id
    __table_args__ = (
        db.UniqueConstraint('auth_provider', 'provider_id', name='unique_provider_user'),
    )
```

#### **Day 2: Authentication Endpoints**

Create `backend/auth.py`:

```python
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import facebook
import jwt
from datetime import datetime, timedelta
import os

class AuthService:
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    FACEBOOK_APP_ID = os.getenv('FACEBOOK_APP_ID')
    FACEBOOK_APP_SECRET = os.getenv('FACEBOOK_APP_SECRET')
    JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    
    @staticmethod
    def verify_google_token(id_token_str):
        """Verify Google ID token and return user info"""
        try:
            idinfo = id_token.verify_oauth2_token(
                id_token_str, 
                google_requests.Request(), 
                AuthService.GOOGLE_CLIENT_ID
            )
            
            return {
                'provider_id': idinfo['sub'],
                'email': idinfo.get('email'),
                'display_name': idinfo.get('name'),
                'avatar_url': idinfo.get('picture'),
            }
        except ValueError:
            raise Exception('Invalid Google token')
    
    @staticmethod
    def verify_facebook_token(access_token):
        """Verify Facebook token and return user info"""
        try:
            graph = facebook.GraphAPI(access_token=access_token)
            profile = graph.get_object('me', fields='id,name,email,picture')
            
            return {
                'provider_id': profile['id'],
                'email': profile.get('email'),
                'display_name': profile.get('name'),
                'avatar_url': profile.get('picture', {}).get('data', {}).get('url'),
            }
        except Exception:
            raise Exception('Invalid Facebook token')
    
    @staticmethod
    def verify_apple_token(id_token_str):
        """Verify Apple ID token and return user info"""
        # Apple token verification is more complex
        # Use PyJWT to decode and verify
        try:
            # Fetch Apple's public keys
            # Verify signature
            # For simplicity, showing basic structure
            decoded = jwt.decode(id_token_str, options={"verify_signature": False})
            
            return {
                'provider_id': decoded['sub'],
                'email': decoded.get('email'),
                'display_name': None,  # Apple doesn't always provide name
                'avatar_url': None,
            }
        except Exception:
            raise Exception('Invalid Apple token')
    
    @staticmethod
    def generate_jwt(user_id):
        """Generate JWT for authenticated user"""
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=7),
            'iat': datetime.utcnow(),
        }
        return jwt.encode(payload, AuthService.JWT_SECRET, algorithm='HS256')
    
    @staticmethod
    def verify_jwt(token):
        """Verify JWT and return user_id"""
        try:
            payload = jwt.decode(token, AuthService.JWT_SECRET, algorithms=['HS256'])
            return payload['user_id']
        except jwt.ExpiredSignatureError:
            raise Exception('Token expired')
        except jwt.InvalidTokenError:
            raise Exception('Invalid token')
```

Update `backend/app.py` with new endpoints:

```python
from auth import AuthService

@app.route('/api/auth/google', methods=['POST'])
def auth_google():
    data = request.json
    id_token_str = data.get('id_token')
    
    if not id_token_str:
        return jsonify({'error': 'ID token required'}), 400
    
    try:
        # Verify token with Google
        user_info = AuthService.verify_google_token(id_token_str)
        
        # Find or create user
        user = User.query.filter_by(
            auth_provider='google',
            provider_id=user_info['provider_id']
        ).first()
        
        if not user:
            # Create new user
            username = user_info['email'].split('@')[0]  # Use email prefix as username
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.query.filter_by(username=username).first():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User(
                username=username,
                auth_provider='google',
                provider_id=user_info['provider_id'],
                email=user_info['email'],
                display_name=user_info['display_name'],
                avatar_url=user_info['avatar_url']
            )
            db.session.add(user)
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate JWT
        token = AuthService.generate_jwt(user.id)
        
        return jsonify({
            'user': user.to_dict(),
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401

# Similar endpoints for Facebook and Apple
@app.route('/api/auth/facebook', methods=['POST'])
def auth_facebook():
    # Similar to Google but use verify_facebook_token
    pass

@app.route('/api/auth/apple', methods=['POST'])
def auth_apple():
    # Similar to Google but use verify_apple_token
    pass

# Keep existing username endpoint
@app.route('/api/auth/username', methods=['POST'])
def auth_username():
    data = request.json
    username = data.get('username')
    
    if not username:
        return jsonify({'error': 'Username required'}), 400
    
    # Find or create user
    user = User.query.filter_by(username=username, auth_provider='username').first()
    
    if not user:
        user = User(username=username, auth_provider='username')
        db.session.add(user)
        db.session.commit()
    
    token = AuthService.generate_jwt(user.id)
    
    return jsonify({
        'user': user.to_dict(),
        'token': token
    }), 200
```

#### **Day 3: Environment Setup**

Create `backend/.env`:

```bash
# Database
DATABASE_URL=sqlite:///memory_match.db

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Apple OAuth (if needed)
APPLE_CLIENT_ID=com.yourapp.service
APPLE_TEAM_ID=your-team-id
```

### Frontend Setup (Days 4-7)

#### **Day 4: Google Sign-In**

Install dependency:
```bash
npm install @react-oauth/google
```

Wrap app with Google OAuth Provider in `main.tsx`:

```typescript
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
```

Create `src/components/auth/GoogleLoginButton.tsx`:

```typescript
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';

export const GoogleLoginButton = () => {
  const { loginWithGoogle, loading } = useAuth();

  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        if (credentialResponse.credential) {
          loginWithGoogle(credentialResponse.credential);
        }
      }}
      onError={() => {
        console.error('Google Login Failed');
      }}
      useOneTap
      disabled={loading}
    />
  );
};
```

#### **Day 5: Facebook Login**

Install dependency:
```bash
npm install react-facebook-login
```

Create `src/components/auth/FacebookLoginButton.tsx`:

```typescript
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import { useAuth } from '../../hooks/useAuth';

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

export const FacebookLoginButton = () => {
  const { loginWithFacebook, loading } = useAuth();

  return (
    <FacebookLogin
      appId={FACEBOOK_APP_ID}
      callback={(response) => {
        if (response.accessToken) {
          loginWithFacebook(response.accessToken);
        }
      }}
      render={(renderProps) => (
        <button
          onClick={renderProps.onClick}
          disabled={loading}
          className="facebook-login-btn"
        >
          Continue with Facebook
        </button>
      )}
    />
  );
};
```

#### **Day 6: Apple Sign-In**

For Apple, you can use either:
1. **AppleID JS** (client-side)
2. **Backend flow** (recommended for security)

Create `src/components/auth/AppleLoginButton.tsx`:

```typescript
import { useAuth } from '../../hooks/useAuth';

export const AppleLoginButton = () => {
  const { loginWithApple, loading } = useAuth();

  const handleAppleLogin = () => {
    // Use Apple's JS SDK
    // @ts-ignore
    window.AppleID.auth.signIn().then((response) => {
      loginWithApple(response.authorization.id_token);
    });
  };

  return (
    <button
      onClick={handleAppleLogin}
      disabled={loading}
      className="apple-login-btn"
    >
      Sign in with Apple
    </button>
  );
};
```

#### **Day 7: Unified Login Screen**

Create `src/components/auth/LoginScreen.tsx`:

```typescript
import { GoogleLoginButton } from './GoogleLoginButton';
import { FacebookLoginButton } from './FacebookLoginButton';
import { AppleLoginButton } from './AppleLoginButton';
import { UsernameLoginForm } from './UsernameLoginForm';
import { useState } from 'react';

export const LoginScreen = () => {
  const [showUsername, setShowUsername] = useState(false);

  return (
    <div className="login-screen">
      <h1>Memory Match</h1>
      <p>Sign in to save your progress</p>

      <div className="social-logins">
        <GoogleLoginButton />
        <FacebookLoginButton />
        <AppleLoginButton />
      </div>

      <div className="divider">
        <span>OR</span>
      </div>

      {showUsername ? (
        <UsernameLoginForm />
      ) : (
        <button onClick={() => setShowUsername(true)} className="username-btn">
          Continue with Username
        </button>
      )}

      <p className="privacy-note">
        By signing in, you agree to our Terms and Privacy Policy
      </p>
    </div>
  );
};
```

---

## 7. Code Examples

### Updated useAuth Hook

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { User } from '../services/types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to load user from storage on mount
    const token = localStorage.getItem(TOKEN_KEY);
    const userData = localStorage.getItem(USER_KEY);
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const loginWithGoogle = async (idToken: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.authGoogle(idToken);
      setUser(response.user);
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithFacebook = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.authFacebook(accessToken);
      setUser(response.user);
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Facebook login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithApple = async (idToken: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.authApple(idToken);
      setUser(response.user);
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Apple login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithUsername = async (username: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.authUsername(username);
      setUser(response.user);
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return {
    user,
    loading,
    error,
    loginWithGoogle,
    loginWithFacebook,
    loginWithApple,
    loginWithUsername,
    logout,
  };
};
```

### Updated API Client

```typescript
// src/services/api.ts - Add these methods

interface AuthResponse {
  user: User;
  token: string;
}

export class MemoryMatchAPI {
  // ... existing code ...

  async authGoogle(idToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    });
  }

  async authFacebook(accessToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/facebook', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken }),
    });
  }

  async authApple(idToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/apple', {
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

  // Add JWT token to all requests
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
}
```

---

## Summary

### ✅ **Benefits of Social Authentication**

1. **Better UX**: One-click sign-in, no password to remember
2. **Trust**: Users trust Google/Facebook/Apple
3. **Profile Data**: Get name, email, avatar automatically
4. **Security**: OAuth providers handle password security
5. **Cross-Device**: Easy to access from multiple devices

### 📝 **Implementation Checklist**

**Backend:**
- [ ] Update User model with social auth fields
- [ ] Install OAuth verification libraries
- [ ] Create AuthService class
- [ ] Add OAuth verification endpoints
- [ ] Generate and verify JWTs
- [ ] Set up environment variables
- [ ] Test token verification

**Frontend:**
- [ ] Install OAuth libraries
- [ ] Set up Google OAuth Provider
- [ ] Create social login buttons
- [ ] Update useAuth hook
- [ ] Create unified LoginScreen
- [ ] Handle token storage
- [ ] Test all login flows

**OAuth Setup:**
- [ ] Create Google OAuth credentials
- [ ] Create Facebook App
- [ ] Create Apple Service ID
- [ ] Configure redirect URIs
- [ ] Set up authorized domains

### 🎯 **Recommended Approach**

**Option 1: Social Auth Primary** (Recommended)
- Show social login buttons first
- Username login as fallback
- Best user experience

**Option 2: Username Primary** (Simpler)
- Keep current username system
- Add social logins as optional
- Easier to implement initially

**Option 3: Hybrid** (Flexible)
- Start with username only (MVP)
- Add social auth in v2.0
- Migrate users gradually

---

**Would you like me to implement any of these approaches for you?**

