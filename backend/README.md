# Memory Match Backend Server

A Python Flask backend server for storing and managing historical game results for the Memory Match mobile game.

## Features

- **User Management**: Create and retrieve user profiles
- **Game Results Storage**: Save historical game results with detailed statistics
- **User Statistics**: Get comprehensive stats (average score, moves, time, etc.)
- **Leaderboard**: View top players by best score
- **RESTful API**: Clean API endpoints for frontend integration
- **SQLite Database**: Lightweight database for easy setup

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment:**
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Running the Server

1. **Start the Flask server:**
   ```bash
   python app.py
   ```

2. The server will start on `http://localhost:5000`

3. Test the health endpoint:
   ```bash
   curl http://localhost:5000/health
   ```

## API Endpoints

### Health Check
- **GET** `/health`
  - Check if server is running

### User Endpoints

- **POST** `/api/users`
  - Create a new user
  - Body: `{ "username": "player1" }`
  
- **GET** `/api/users/<username>`
  - Get user by username
  
- **GET** `/api/users`
  - Get all users

### Game Results Endpoints

- **POST** `/api/results`
  - Save a game result
  - Body:
    ```json
    {
      "user_id": 1,
      "score": 1000,
      "moves": 20,
      "time_taken": 120,
      "difficulty": "medium",
      "grid_size": "4x4",
      "completed": true
    }
    ```

- **GET** `/api/results/user/<user_id>`
  - Get all results for a specific user
  - Query params: `?limit=10&difficulty=medium`

- **GET** `/api/results/user/<user_id>/stats`
  - Get statistics for a specific user
  - Returns: total games, averages, best score, etc.

- **GET** `/api/leaderboard`
  - Get top players
  - Query params: `?limit=10`

## Example Usage

### Create a User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'
```

### Save a Game Result
```bash
curl -X POST http://localhost:5000/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "score": 1500,
    "moves": 25,
    "time_taken": 180,
    "difficulty": "hard",
    "grid_size": "6x6"
  }'
```

### Get User Stats
```bash
curl http://localhost:5000/api/results/user/1/stats
```

### Get Leaderboard
```bash
curl http://localhost:5000/api/leaderboard?limit=10
```

## Database Schema

### Users Table
- `id`: Integer (Primary Key)
- `username`: String (Unique)
- `created_at`: DateTime

### Game Results Table
- `id`: Integer (Primary Key)
- `user_id`: Integer (Foreign Key)
- `score`: Integer
- `moves`: Integer
- `time_taken`: Integer (seconds)
- `difficulty`: String (easy/medium/hard)
- `grid_size`: String (e.g., "4x4")
- `completed`: Boolean
- `played_at`: DateTime

## Integration with Frontend

Update your React app to communicate with the backend:

```typescript
const API_BASE_URL = 'http://localhost:5000/api';

// Create user
async function createUser(username: string) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  return response.json();
}

// Save game result
async function saveGameResult(result: GameResult) {
  const response = await fetch(`${API_BASE_URL}/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result)
  });
  return response.json();
}

// Get user stats
async function getUserStats(userId: number) {
  const response = await fetch(`${API_BASE_URL}/results/user/${userId}/stats`);
  return response.json();
}
```

## Development

- Database file is created as `memory_match.db` in the backend directory
- CORS is enabled for all origins (adjust in production)
- Debug mode is enabled by default (disable in production)

## Production Considerations

1. Use a production WSGI server (e.g., Gunicorn)
2. Use PostgreSQL or MySQL instead of SQLite
3. Add authentication and authorization
4. Configure CORS to allow only your frontend domain
5. Use environment variables for configuration
6. Add input validation and sanitization
7. Implement rate limiting
8. Add logging and monitoring

## License

MIT
