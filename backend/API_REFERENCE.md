# Memory Match Backend - API Reference

Complete reference guide for all available API endpoints.

**Base URL:** `http://localhost:5001`  
**Production URL:** `https://your-domain.com` (when deployed)

**Content-Type:** `application/json`  
**Response Format:** JSON

---

## Table of Contents

1. [Health Check](#health-check)
2. [User Endpoints](#user-endpoints)
   - [Create User](#create-user)
   - [Get User by Username](#get-user-by-username)
   - [Get All Users](#get-all-users)
3. [Game Results Endpoints](#game-results-endpoints)
   - [Save Game Result](#save-game-result)
   - [Get User's Game History](#get-users-game-history)
   - [Get User's Statistics](#get-users-statistics)
4. [Error Responses](#error-responses)
5. [Examples](#examples)

---

## Health Check

### Check Server Status

Verify that the backend server is running and healthy.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "message": "Backend server is running"
}
```

**Status Codes:**
- `200 OK` - Server is running

**Example:**
```bash
curl http://localhost:5001/health
```

---

## User Endpoints

### Create User

Create a new user account. If the username already exists, returns the existing user.

**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "username": "string (required, max 80 chars)"
}
```

**Success Response (New User):**
```json
{
  "id": 1,
  "username": "player123",
  "created_at": "2025-11-02T10:30:00.000000"
}
```

**Status Codes:**
- `201 Created` - New user created successfully
- `200 OK` - User already exists (returns existing user)
- `400 Bad Request` - Missing username field

**Example:**
```bash
curl -X POST http://localhost:5001/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'
```

**Validation Rules:**
- Username is required
- Username must be a non-empty string
- Username max length: 80 characters
- Username must be unique (case-sensitive)

---

### Get User by Username

Retrieve a user's information by their username.

**Endpoint:** `GET /api/users/<username>`

**URL Parameters:**
- `username` (string, required) - The username to look up

**Success Response:**
```json
{
  "id": 1,
  "username": "player123",
  "created_at": "2025-11-02T10:30:00.000000"
}
```

**Status Codes:**
- `200 OK` - User found
- `404 Not Found` - User does not exist

**Example:**
```bash
curl http://localhost:5001/api/users/john_doe
```

---

### Get All Users

Retrieve a list of all registered users.

**Endpoint:** `GET /api/users`

**Success Response:**
```json
[
  {
    "id": 1,
    "username": "player123",
    "created_at": "2025-11-02T10:30:00.000000"
  },
  {
    "id": 2,
    "username": "player456",
    "created_at": "2025-11-02T11:00:00.000000"
  }
]
```

**Status Codes:**
- `200 OK` - Success (returns empty array if no users)

**Example:**
```bash
curl http://localhost:5001/api/users
```

**Notes:**
- Returns all users without pagination
- Results are not sorted by default
- Empty array returned if no users exist

---

## Game Results Endpoints

### Save Game Result

Store a completed game result for a user.

**Endpoint:** `POST /api/results`

**Request Body:**
```json
{
  "user_id": 1,                    // Required: integer
  "score": 1500,                   // Required: integer
  "moves": 25,                     // Required: integer
  "time_taken": 180,              // Required: integer (seconds)
  "difficulty": "medium",          // Optional: string (default: "medium")
  "grid_size": "4x4",             // Optional: string (default: "4x4")
  "completed": true               // Optional: boolean (default: true)
}
```

**Field Descriptions:**
- `user_id` - ID of the user who played the game
- `score` - Final score achieved
- `moves` - Total number of moves/flips made
- `time_taken` - Time spent in seconds
- `difficulty` - Game difficulty (e.g., "easy", "medium", "hard")
- `grid_size` - Grid dimensions (e.g., "4x4", "6x6", "8x8")
- `completed` - Whether the game was completed

**Success Response:**
```json
{
  "id": 42,
  "user_id": 1,
  "score": 1500,
  "moves": 25,
  "time_taken": 180,
  "difficulty": "medium",
  "grid_size": "4x4",
  "completed": true,
  "played_at": "2025-11-02T14:30:00.000000"
}
```

**Status Codes:**
- `201 Created` - Result saved successfully
- `400 Bad Request` - Missing required fields or invalid data

**Example:**
```bash
curl -X POST http://localhost:5001/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "score": 2000,
    "moves": 20,
    "time_taken": 150,
    "difficulty": "hard",
    "grid_size": "6x6"
  }'
```

**Validation Rules:**
- All required fields must be present
- `user_id` must reference an existing user
- Numeric fields must be positive integers
- `completed` defaults to `true` if not provided

---

### Get User's Game History

Retrieve all game results for a specific user with optional filtering.

**Endpoint:** `GET /api/results/user/<user_id>`

**URL Parameters:**
- `user_id` (integer, required) - The ID of the user

**Query Parameters:**
- `limit` (integer, optional) - Maximum number of results to return
- `difficulty` (string, optional) - Filter by difficulty level

**Success Response:**
```json
{
  "user": {
    "id": 1,
    "username": "player123",
    "created_at": "2025-11-02T10:30:00.000000"
  },
  "results": [
    {
      "id": 5,
      "user_id": 1,
      "score": 2000,
      "moves": 20,
      "time_taken": 150,
      "difficulty": "hard",
      "grid_size": "6x6",
      "completed": true,
      "played_at": "2025-11-02T15:00:00.000000"
    },
    {
      "id": 3,
      "user_id": 1,
      "score": 1500,
      "moves": 25,
      "time_taken": 180,
      "difficulty": "medium",
      "grid_size": "4x4",
      "completed": true,
      "played_at": "2025-11-02T14:30:00.000000"
    }
  ],
  "total_games": 2
}
```

**Status Codes:**
- `200 OK` - Success (empty results array if no games played)
- `404 Not Found` - User does not exist

**Examples:**

**Get all results:**
```bash
curl http://localhost:5001/api/results/user/1
```

**Get last 10 results:**
```bash
curl http://localhost:5001/api/results/user/1?limit=10
```

**Get only hard difficulty results:**
```bash
curl http://localhost:5001/api/results/user/1?difficulty=hard
```

**Combine filters:**
```bash
curl http://localhost:5001/api/results/user/1?limit=5&difficulty=medium
```

**Notes:**
- Results are ordered by `played_at` descending (most recent first)
- `total_games` reflects the number of results returned (after filtering)
- Empty results array returned if user has no games or no matches found

---

### Get User's Statistics

Calculate and retrieve comprehensive statistics for a user.

**Endpoint:** `GET /api/results/user/<user_id>/stats`

**URL Parameters:**
- `user_id` (integer, required) - The ID of the user

**Success Response:**
```json
{
  "user": {
    "id": 1,
    "username": "player123",
    "created_at": "2025-11-02T10:30:00.000000"
  },
  "stats": {
    "total_games": 10,
    "average_score": 1750.50,
    "average_moves": 22.30,
    "average_time": 165.20,
    "best_score": 2500,
    "total_time_played": 1652
  }
}
```

**Statistics Explained:**
- `total_games` - Total number of games played
- `average_score` - Mean score across all games (rounded to 2 decimals)
- `average_moves` - Mean number of moves (rounded to 2 decimals)
- `average_time` - Mean time per game in seconds (rounded to 2 decimals)
- `best_score` - Highest score ever achieved
- `total_time_played` - Sum of all game times in seconds

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - User does not exist

**Example:**
```bash
curl http://localhost:5001/api/results/user/1/stats
```

**Notes:**
- If user has no games, all stats return 0
- Stats include all games regardless of difficulty or completion status
- Calculations use all historical data (not filtered)

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Descriptive error message"
}
```

### Common Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| `400 Bad Request` | Invalid input | Missing required fields, invalid JSON |
| `404 Not Found` | Resource not found | User or result doesn't exist |
| `500 Internal Server Error` | Server error | Database issues, unexpected errors |

### Error Examples

**Missing Required Field:**
```json
{
  "error": "username is required"
}
```

**User Not Found:**
```json
{
  "error": "User not found"
}
```

**Missing Required Fields:**
```json
{
  "error": "score is required"
}
```

---

## Examples

### Complete User Journey

Here's a complete workflow from creating a user to viewing their stats:

#### 1. Create a User
```bash
curl -X POST http://localhost:5001/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "alice"}'
```

**Response:**
```json
{
  "id": 1,
  "username": "alice",
  "created_at": "2025-11-02T10:00:00.000000"
}
```

#### 2. Play Games and Save Results

**First Game:**
```bash
curl -X POST http://localhost:5001/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "score": 1200,
    "moves": 30,
    "time_taken": 200,
    "difficulty": "easy",
    "grid_size": "4x4"
  }'
```

**Second Game:**
```bash
curl -X POST http://localhost:5001/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "score": 1800,
    "moves": 22,
    "time_taken": 160,
    "difficulty": "medium",
    "grid_size": "4x4"
  }'
```

**Third Game:**
```bash
curl -X POST http://localhost:5001/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "score": 2500,
    "moves": 18,
    "time_taken": 140,
    "difficulty": "hard",
    "grid_size": "6x6"
  }'
```

#### 3. View Game History
```bash
curl http://localhost:5001/api/results/user/1
```

#### 4. View Statistics
```bash
curl http://localhost:5001/api/results/user/1/stats
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "alice",
    "created_at": "2025-11-02T10:00:00.000000"
  },
  "stats": {
    "total_games": 3,
    "average_score": 1833.33,
    "average_moves": 23.33,
    "average_time": 166.67,
    "best_score": 2500,
    "total_time_played": 500
  }
}
```

---

### Frontend Integration Example (JavaScript/React)

```javascript
// api.js - API Client
const API_BASE = 'http://localhost:5001';

class MemoryMatchAPI {
  // Create a new user
  async createUser(username) {
    const response = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }

  // Get user by username
  async getUser(username) {
    const response = await fetch(`${API_BASE}/api/users/${username}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }

  // Save game result
  async saveGameResult(gameData) {
    const response = await fetch(`${API_BASE}/api/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }

  // Get user's game history
  async getUserHistory(userId, options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.difficulty) params.append('difficulty', options.difficulty);
    
    const url = `${API_BASE}/api/results/user/${userId}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }

  // Get user's statistics
  async getUserStats(userId) {
    const response = await fetch(`${API_BASE}/api/results/user/${userId}/stats`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }
}

// Export singleton instance
export const api = new MemoryMatchAPI();
```

**Usage in React Component:**

```javascript
import { api } from './api';

function GameComponent() {
  const handleGameEnd = async (gameData) => {
    try {
      // Save the game result
      const result = await api.saveGameResult({
        user_id: currentUser.id,
        score: gameData.score,
        moves: gameData.moves,
        time_taken: gameData.timeInSeconds,
        difficulty: gameData.difficulty,
        grid_size: gameData.gridSize
      });
      
      console.log('Game saved:', result);
      
      // Get updated stats
      const stats = await api.getUserStats(currentUser.id);
      console.log('Updated stats:', stats);
      
    } catch (error) {
      console.error('Failed to save game:', error.message);
    }
  };

  const loadUserHistory = async () => {
    try {
      // Get last 10 games
      const history = await api.getUserHistory(currentUser.id, { limit: 10 });
      setGameHistory(history.results);
    } catch (error) {
      console.error('Failed to load history:', error.message);
    }
  };

  // ... rest of component
}
```

---

## TypeScript Types

For TypeScript projects, here are the type definitions:

```typescript
// types.ts
export interface User {
  id: number;
  username: string;
  created_at: string;
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

export interface CreateGameResultRequest {
  user_id: number;
  score: number;
  moves: number;
  time_taken: number;
  difficulty?: string;
  grid_size?: string;
  completed?: boolean;
}
```

---

## Testing with Postman

### Import into Postman

Create a Postman Collection with these requests:

**1. Health Check**
- Method: GET
- URL: `http://localhost:5001/health`

**2. Create User**
- Method: POST
- URL: `http://localhost:5001/api/users`
- Body (JSON):
  ```json
  {
    "username": "test_user"
  }
  ```

**3. Save Game Result**
- Method: POST
- URL: `http://localhost:5001/api/results`
- Body (JSON):
  ```json
  {
    "user_id": 1,
    "score": 1500,
    "moves": 25,
    "time_taken": 180
  }
  ```

**4. Get User History**
- Method: GET
- URL: `http://localhost:5001/api/results/user/1`

**5. Get User Stats**
- Method: GET
- URL: `http://localhost:5001/api/results/user/1/stats`

---

## Rate Limiting

Currently, there is **no rate limiting** implemented. For production deployment, consider:

- Implementing rate limiting per IP address
- Limiting requests per user
- Using libraries like `Flask-Limiter`

---

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is **enabled for all origins** in development.

For production, update the CORS configuration in `app.py`:

```python
from flask_cors import CORS

# Development (current)
CORS(app)

# Production (recommended)
CORS(app, origins=["https://yourdomain.com"])
```

---

## Changelog

### Version 1.0 (November 2, 2025)
- Initial API release
- User management endpoints
- Game results tracking
- Statistics calculation
- Removed leaderboard functionality (focused on individual user results)

---

## Support

For issues or questions:
- Check the [README.md](README.md) for setup instructions
- Review the [DESIGN.md](DESIGN.md) for architecture details
- Report issues on GitHub

---

**API Version:** 1.0  
**Last Updated:** November 2, 2025  
**Base URL:** http://localhost:5001
