# Memory Match Backend Server - Design Document

## 1. Overview

### 1.1 Purpose
The Memory Match Backend Server is a RESTful API service designed to store, manage, and retrieve historical game results for the Memory Match mobile game. It provides user management, game result tracking, statistics calculation, and leaderboard functionality.

### 1.2 Technology Stack
- **Framework**: Flask 3.0.0 (Python web framework)
- **ORM**: SQLAlchemy (via Flask-SQLAlchemy 3.1.1)
- **Database**: SQLite (development), easily upgradable to PostgreSQL/MySQL
- **CORS**: Flask-CORS 4.0.0 (Cross-Origin Resource Sharing)
- **Language**: Python 3.8+

### 1.3 Design Principles
- **RESTful Architecture**: Clean, predictable API endpoints following REST conventions
- **Stateless**: Each request contains all necessary information
- **Separation of Concerns**: Models, routes, and business logic are separated
- **Scalability**: Designed to easily migrate from SQLite to production databases
- **CORS-Enabled**: Support for cross-origin requests from mobile/web clients

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│            (React/TypeScript - Mobile Web)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTP/HTTPS Requests (JSON)
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Flask Backend Server                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Layer (app.py)                     │   │
│  │  - User Management Routes                           │   │
│  │  - Game Results Routes                              │   │
│  │  - Statistics Routes                                │   │
│  │  - Leaderboard Routes                               │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │           Business Logic Layer                      │   │
│  │  - Input Validation                                 │   │
│  │  - Data Processing                                  │   │
│  │  - Statistics Calculation                           │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │          ORM Layer (models.py)                      │   │
│  │  - User Model                                       │   │
│  │  - GameResult Model                                 │   │
│  │  - Relationships & Constraints                      │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          │ SQLAlchemy ORM
                          │
┌─────────────────────────▼─────────────────────────────────┐
│                   Database Layer                          │
│               SQLite / PostgreSQL / MySQL                 │
│  ┌─────────────────┐         ┌──────────────────────┐    │
│  │   Users Table   │         │  Game Results Table  │    │
│  └─────────────────┘         └──────────────────────┘    │
└───────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

1. **Client Request** → Frontend sends HTTP request to API endpoint
2. **CORS Validation** → Flask-CORS validates cross-origin request
3. **Route Handling** → Flask routes request to appropriate handler
4. **Input Validation** → Validate request payload and parameters
5. **Business Logic** → Process data, perform calculations
6. **Database Query** → SQLAlchemy executes database operations
7. **Response Formation** → Format data as JSON
8. **Client Response** → Return HTTP response with status code

---

## 3. Database Design

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────┐
│        Users            │
├─────────────────────────┤
│ id (PK)                 │
│ username (UNIQUE)       │
│ created_at              │
└───────────┬─────────────┘
            │
            │ 1:N
            │
┌───────────▼─────────────┐
│     GameResults         │
├─────────────────────────┤
│ id (PK)                 │
│ user_id (FK)            │
│ score                   │
│ moves                   │
│ time_taken              │
│ difficulty              │
│ grid_size               │
│ completed               │
│ played_at               │
└─────────────────────────┘
```

### 3.2 Table Schemas

#### Users Table
| Column      | Type         | Constraints                    | Description                    |
|-------------|--------------|--------------------------------|--------------------------------|
| id          | INTEGER      | PRIMARY KEY, AUTO_INCREMENT    | Unique user identifier         |
| username    | VARCHAR(80)  | UNIQUE, NOT NULL              | User's display name            |
| created_at  | DATETIME     | DEFAULT CURRENT_TIMESTAMP      | Account creation timestamp     |

**Indexes:**
- Primary Key on `id`
- Unique Index on `username`

#### GameResults Table
| Column      | Type         | Constraints                    | Description                    |
|-------------|--------------|--------------------------------|--------------------------------|
| id          | INTEGER      | PRIMARY KEY, AUTO_INCREMENT    | Unique result identifier       |
| user_id     | INTEGER      | FOREIGN KEY → users.id, NOT NULL | Owner of this result         |
| score       | INTEGER      | NOT NULL                       | Final game score               |
| moves       | INTEGER      | NOT NULL                       | Number of moves made           |
| time_taken  | INTEGER      | NOT NULL                       | Time in seconds                |
| difficulty  | VARCHAR(20)  | NULL                           | Game difficulty level          |
| grid_size   | VARCHAR(10)  | NULL                           | Grid dimensions (e.g., "4x4")  |
| completed   | BOOLEAN      | DEFAULT TRUE                   | Whether game was completed     |
| played_at   | DATETIME     | DEFAULT CURRENT_TIMESTAMP      | Game completion timestamp      |

**Indexes:**
- Primary Key on `id`
- Foreign Key Index on `user_id`
- Index on `played_at` (for sorting recent games)
- Composite Index on `(user_id, score)` (for leaderboard queries)

### 3.3 Relationships

- **One-to-Many**: One User can have many GameResults
- **Cascade Delete**: When a User is deleted, all associated GameResults are deleted
- **Referential Integrity**: Enforced via foreign key constraints

---

## 4. API Design

### 4.1 API Endpoints Overview

| Method | Endpoint                          | Purpose                          |
|--------|-----------------------------------|----------------------------------|
| GET    | `/health`                         | Health check                     |
| POST   | `/api/users`                      | Create new user                  |
| GET    | `/api/users/<username>`           | Get user by username             |
| GET    | `/api/users`                      | Get all users                    |
| POST   | `/api/results`                    | Save game result                 |
| GET    | `/api/results/user/<user_id>`     | Get user's game history          |
| GET    | `/api/results/user/<user_id>/stats` | Get user statistics            |
| GET    | `/api/leaderboard`                | Get top players                  |

### 4.2 Detailed Endpoint Specifications

#### 4.2.1 Health Check

**Endpoint:** `GET /health`

**Purpose:** Verify server is running

**Response:**
```json
{
  "status": "healthy",
  "message": "Backend server is running"
}
```

**Status Codes:**
- `200 OK`: Server is healthy

---

#### 4.2.2 Create User

**Endpoint:** `POST /api/users`

**Purpose:** Create a new user or return existing user

**Request Body:**
```json
{
  "username": "player123"
}
```

**Response (New User - 201):**
```json
{
  "id": 1,
  "username": "player123",
  "created_at": "2025-11-01T12:00:00"
}
```

**Response (Existing User - 200):**
```json
{
  "id": 1,
  "username": "player123",
  "created_at": "2025-11-01T12:00:00"
}
```

**Status Codes:**
- `200 OK`: User already exists
- `201 Created`: New user created
- `400 Bad Request`: Missing username

**Validation:**
- Username is required
- Username must be non-empty string
- Username max length: 80 characters

---

#### 4.2.3 Get User by Username

**Endpoint:** `GET /api/users/<username>`

**Purpose:** Retrieve user information

**Response:**
```json
{
  "id": 1,
  "username": "player123",
  "created_at": "2025-11-01T12:00:00"
}
```

**Status Codes:**
- `200 OK`: User found
- `404 Not Found`: User doesn't exist

---

#### 4.2.4 Get All Users

**Endpoint:** `GET /api/users`

**Purpose:** Retrieve all registered users

**Response:**
```json
[
  {
    "id": 1,
    "username": "player123",
    "created_at": "2025-11-01T12:00:00"
  },
  {
    "id": 2,
    "username": "player456",
    "created_at": "2025-11-01T13:00:00"
  }
]
```

**Status Codes:**
- `200 OK`: Success (empty array if no users)

---

#### 4.2.5 Save Game Result

**Endpoint:** `POST /api/results`

**Purpose:** Store a completed game result

**Request Body:**
```json
{
  "user_id": 1,
  "score": 1500,
  "moves": 25,
  "time_taken": 180,
  "difficulty": "hard",
  "grid_size": "6x6",
  "completed": true
}
```

**Required Fields:**
- `user_id` (integer)
- `score` (integer)
- `moves` (integer)
- `time_taken` (integer)

**Optional Fields:**
- `difficulty` (string): defaults to "medium"
- `grid_size` (string): defaults to "4x4"
- `completed` (boolean): defaults to true

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "score": 1500,
  "moves": 25,
  "time_taken": 180,
  "difficulty": "hard",
  "grid_size": "6x6",
  "completed": true,
  "played_at": "2025-11-01T14:30:00"
}
```

**Status Codes:**
- `201 Created`: Result saved successfully
- `400 Bad Request`: Missing required fields

**Validation:**
- All required fields must be present
- Numeric fields must be positive integers
- User must exist (foreign key constraint)

---

#### 4.2.6 Get User's Game History

**Endpoint:** `GET /api/results/user/<user_id>`

**Purpose:** Retrieve all game results for a specific user

**Query Parameters:**
- `limit` (optional): Maximum number of results (default: all)
- `difficulty` (optional): Filter by difficulty level

**Examples:**
- `/api/results/user/1` - All results for user 1
- `/api/results/user/1?limit=10` - Last 10 results for user 1
- `/api/results/user/1?difficulty=hard` - Only hard difficulty results

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "player123",
    "created_at": "2025-11-01T12:00:00"
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
      "played_at": "2025-11-01T15:00:00"
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
      "played_at": "2025-11-01T14:30:00"
    }
  ],
  "total_games": 2
}
```

**Status Codes:**
- `200 OK`: Success (empty results array if no games)
- `404 Not Found`: User doesn't exist

**Notes:**
- Results are ordered by `played_at` DESC (most recent first)

---

#### 4.2.7 Get User Statistics

**Endpoint:** `GET /api/results/user/<user_id>/stats`

**Purpose:** Calculate and return comprehensive user statistics

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "player123",
    "created_at": "2025-11-01T12:00:00"
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

**Status Codes:**
- `200 OK`: Success (zero stats if no games played)
- `404 Not Found`: User doesn't exist

**Statistics Calculations:**
- `total_games`: Count of all game results
- `average_score`: Mean score across all games (rounded to 2 decimals)
- `average_moves`: Mean moves across all games (rounded to 2 decimals)
- `average_time`: Mean time in seconds (rounded to 2 decimals)
- `best_score`: Maximum score achieved
- `total_time_played`: Sum of all game times in seconds

---

#### 4.2.8 Get Leaderboard

**Endpoint:** `GET /api/leaderboard`

**Purpose:** Retrieve top players ranked by best score

**Query Parameters:**
- `limit` (optional): Number of top players (default: 10, max: 100)

**Example:**
- `/api/leaderboard?limit=5` - Top 5 players

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": 5,
      "username": "champion",
      "best_score": 3000,
      "total_games": 25
    },
    {
      "rank": 2,
      "user_id": 2,
      "username": "pro_player",
      "best_score": 2800,
      "total_games": 30
    },
    {
      "rank": 3,
      "user_id": 1,
      "username": "player123",
      "best_score": 2500,
      "total_games": 10
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Success (empty array if no players)

**Ranking Logic:**
- Players ranked by their highest score
- Ties are broken by user_id (lower id = higher rank)
- Only users with at least one game result are included

---

## 5. Data Models

### 5.1 User Model

**Purpose:** Represent a player/user in the system

**Attributes:**
```python
class User:
    id: int                    # Primary key
    username: str              # Unique identifier
    created_at: datetime       # Registration timestamp
    game_results: List[GameResult]  # Relationship
```

**Methods:**
```python
def to_dict() -> dict:
    """Convert user object to dictionary for JSON serialization"""
```

**Business Rules:**
- Username must be unique across the system
- Username cannot be changed after creation
- Deleting a user cascades to all game results

---

### 5.2 GameResult Model

**Purpose:** Store individual game session results

**Attributes:**
```python
class GameResult:
    id: int              # Primary key
    user_id: int         # Foreign key to User
    score: int           # Final score
    moves: int           # Number of moves/flips
    time_taken: int      # Duration in seconds
    difficulty: str      # Difficulty level
    grid_size: str       # Grid dimensions
    completed: bool      # Completion status
    played_at: datetime  # Game timestamp
    user: User           # Relationship
```

**Methods:**
```python
def to_dict() -> dict:
    """Convert game result object to dictionary for JSON serialization"""
```

**Business Rules:**
- Score, moves, and time_taken must be non-negative
- Must be associated with a valid user
- Difficulty levels: "easy", "medium", "hard" (flexible)
- Grid sizes: "4x4", "6x6", "8x8", etc. (flexible)

---

## 6. Security Considerations

### 6.1 Current Implementation

**CORS (Cross-Origin Resource Sharing):**
- Enabled for all origins (development mode)
- Allows cross-origin requests from mobile/web clients

**Input Validation:**
- Required field validation
- Type checking for numeric values
- Foreign key constraint enforcement

### 6.2 Production Recommendations

**Authentication & Authorization:**
- Implement JWT (JSON Web Tokens) or OAuth2
- Add user authentication endpoints (login/register)
- Protect endpoints with authentication middleware
- Add role-based access control if needed

**CORS Hardening:**
```python
# Restrict to specific origins
CORS(app, origins=["https://yourdomain.com"])
```

**Input Sanitization:**
- Add input length limits
- Sanitize string inputs to prevent XSS
- Validate data types strictly
- Implement rate limiting

**SQL Injection Prevention:**
- Already protected via SQLAlchemy ORM
- Never use raw SQL with user input

**HTTPS:**
- Enforce HTTPS in production
- Use SSL/TLS certificates

**Environment Variables:**
- Store sensitive config in environment variables
- Use `.env` files for configuration
- Never commit secrets to version control

**Additional Security Measures:**
- Add request logging and monitoring
- Implement API rate limiting (Flask-Limiter)
- Add CSRF protection for state-changing operations
- Validate file uploads if implemented
- Add request size limits

---

## 7. Performance Considerations

### 7.1 Database Optimization

**Indexes:**
- Primary key index on `id` columns (automatic)
- Unique index on `users.username`
- Foreign key index on `game_results.user_id`
- Composite index on `(user_id, score)` for leaderboard queries
- Index on `played_at` for time-based sorting

**Query Optimization:**
- Use SQLAlchemy's eager loading for relationships
- Limit result sets with pagination
- Add database query caching for frequently accessed data

### 7.2 Caching Strategy

**Candidates for Caching:**
- Leaderboard results (short TTL: 1-5 minutes)
- User statistics (invalidate on new game result)
- User profile data (invalidate on update)

**Implementation Options:**
- Redis for distributed caching
- Flask-Caching for simple in-memory caching

### 7.3 Scalability

**Horizontal Scaling:**
- Stateless design allows multiple server instances
- Use load balancer (nginx, HAProxy)
- Share session state via Redis/database

**Database Scaling:**
- Migrate from SQLite to PostgreSQL/MySQL
- Implement read replicas for read-heavy workloads
- Consider connection pooling (SQLAlchemy already supports this)

**Asynchronous Processing:**
- Move heavy computations to background tasks (Celery)
- Use message queue (RabbitMQ, Redis) for async operations

---

## 8. Error Handling

### 8.1 HTTP Status Codes

| Code | Meaning           | Usage                                    |
|------|-------------------|------------------------------------------|
| 200  | OK                | Successful GET/existing resource         |
| 201  | Created           | Successful POST/new resource             |
| 400  | Bad Request       | Invalid input/missing required fields    |
| 404  | Not Found         | Resource doesn't exist                   |
| 500  | Internal Error    | Unexpected server error                  |

### 8.2 Error Response Format

**Standard Error Response:**
```json
{
  "error": "Descriptive error message"
}
```

**Example Errors:**
```json
// Missing required field
{
  "error": "score is required"
}

// Resource not found
{
  "error": "User not found"
}
```

### 8.3 Error Handling Best Practices

**Input Validation:**
- Validate all required fields
- Check data types
- Validate value ranges
- Return descriptive error messages

**Database Errors:**
- Catch constraint violations
- Handle foreign key errors gracefully
- Log database errors for debugging

**Exception Handling:**
- Use try-catch blocks for database operations
- Log exceptions with stack traces
- Return generic error messages to clients (hide internal details)

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Model Tests:**
- Test model creation and validation
- Test relationships and cascades
- Test serialization (to_dict methods)

**Endpoint Tests:**
- Test each endpoint with valid inputs
- Test with invalid inputs
- Test edge cases (empty data, boundary values)
- Test error responses

### 9.2 Integration Tests

- Test complete user workflows
- Test database transactions
- Test CORS functionality
- Test concurrent requests

### 9.3 Testing Tools

**Recommended:**
- `pytest` - Testing framework
- `pytest-flask` - Flask testing utilities
- `coverage.py` - Code coverage
- `faker` - Generate test data

**Example Test Structure:**
```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Test configuration
│   ├── test_models.py       # Model tests
│   ├── test_endpoints.py    # API endpoint tests
│   └── test_integration.py  # Integration tests
```

---

## 10. Deployment

### 10.1 Development Environment

**Current Setup:**
- Flask development server
- SQLite database
- Debug mode enabled
- CORS enabled for all origins

**Running:**
```bash
python app.py
```

### 10.2 Production Environment

**WSGI Server:**
Use production-grade WSGI server instead of Flask dev server:

```bash
# Gunicorn (recommended)
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# uWSGI (alternative)
uwsgi --http 0.0.0.0:5000 --wsgi-file app.py --callable app
```

**Database:**
- Migrate to PostgreSQL or MySQL
- Use connection pooling
- Regular backups

**Environment Variables:**
```bash
export FLASK_ENV=production
export DATABASE_URL=postgresql://user:pass@host/db
export SECRET_KEY=your-secret-key
```

**Reverse Proxy:**
- Use nginx or Apache as reverse proxy
- Handle SSL termination
- Serve static files (if any)
- Load balancing

### 10.3 Containerization (Docker)

**Dockerfile Example:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://db/memory_match
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=memory_match
```

### 10.4 Cloud Deployment Options

**Platform as a Service (PaaS):**
- Heroku
- Google App Engine
- AWS Elastic Beanstalk
- Azure App Service

**Container Orchestration:**
- Kubernetes
- AWS ECS/EKS
- Google Kubernetes Engine

**Serverless:**
- AWS Lambda + API Gateway
- Google Cloud Functions
- Azure Functions

---

## 11. Monitoring & Logging

### 11.1 Logging Strategy

**Log Levels:**
- `DEBUG`: Detailed diagnostic information
- `INFO`: General informational messages
- `WARNING`: Warning messages (recoverable issues)
- `ERROR`: Error messages (application errors)
- `CRITICAL`: Critical errors (system failures)

**What to Log:**
- API requests (endpoint, method, status code)
- Database operations
- Errors and exceptions with stack traces
- Performance metrics (response times)
- Security events (failed authentication, suspicious activity)

**Implementation:**
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
```

### 11.2 Monitoring Metrics

**Application Metrics:**
- Request rate (requests per second)
- Response time (average, p95, p99)
- Error rate (percentage of failed requests)
- Active users/sessions

**Database Metrics:**
- Query execution time
- Connection pool usage
- Slow query log

**System Metrics:**
- CPU usage
- Memory usage
- Disk I/O
- Network I/O

**Tools:**
- Prometheus + Grafana
- New Relic
- DataDog
- Application Insights (Azure)

---

## 12. Future Enhancements

### 12.1 Feature Additions

**User Features:**
- User profiles with avatars
- Friend system and social features
- Achievements and badges
- User preferences/settings

**Game Features:**
- Multiple game modes tracking
- Daily challenges
- Tournaments and competitions
- Replay functionality

**Analytics:**
- Detailed gameplay analytics
- Heatmaps of common mistakes
- Progress tracking over time
- Personalized insights

**Social Features:**
- Share results on social media
- Challenge friends
- Chat functionality
- Multiplayer modes

### 12.2 Technical Improvements

**Performance:**
- Implement caching layer (Redis)
- Database query optimization
- Add CDN for static assets
- Implement pagination for all list endpoints

**Security:**
- Add JWT authentication
- Implement OAuth2 (Google, Facebook login)
- Add 2FA (Two-Factor Authentication)
- Rate limiting per user/IP

**Developer Experience:**
- OpenAPI/Swagger documentation
- GraphQL API option
- WebSocket support for real-time features
- API versioning (v1, v2, etc.)

**DevOps:**
- CI/CD pipeline (GitHub Actions, Jenkins)
- Automated testing in pipeline
- Blue-green deployment
- Automated database migrations

### 12.3 Data Science Opportunities

**Machine Learning:**
- Cheat detection algorithms
- Difficulty adjustment based on player skill
- Personalized game recommendations
- Player behavior prediction

**Analytics:**
- Player segmentation
- Retention analysis
- A/B testing framework
- Predictive analytics for player churn

---

## 13. API Usage Examples

### 13.1 Complete User Flow

**1. Create/Get User:**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'
```

**2. Play Game and Save Result:**
```bash
curl -X POST http://localhost:5000/api/results \
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

**3. Get User Statistics:**
```bash
curl http://localhost:5000/api/results/user/1/stats
```

**4. View Leaderboard:**
```bash
curl http://localhost:5000/api/leaderboard?limit=10
```

### 13.2 Frontend Integration (TypeScript)

```typescript
// api.ts - API client module
const API_BASE = 'http://localhost:5000/api';

interface User {
  id: number;
  username: string;
  created_at: string;
}

interface GameResult {
  user_id: number;
  score: number;
  moves: number;
  time_taken: number;
  difficulty?: string;
  grid_size?: string;
  completed?: boolean;
}

interface UserStats {
  user: User;
  stats: {
    total_games: number;
    average_score: number;
    average_moves: number;
    average_time: number;
    best_score: number;
    total_time_played: number;
  };
}

class MemoryMatchAPI {
  async createUser(username: string): Promise<User> {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  }

  async saveGameResult(result: GameResult): Promise<void> {
    const response = await fetch(`${API_BASE}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    });
    if (!response.ok) throw new Error('Failed to save result');
  }

  async getUserStats(userId: number): Promise<UserStats> {
    const response = await fetch(`${API_BASE}/results/user/${userId}/stats`);
    if (!response.ok) throw new Error('Failed to get stats');
    return response.json();
  }

  async getLeaderboard(limit: number = 10) {
    const response = await fetch(`${API_BASE}/leaderboard?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to get leaderboard');
    return response.json();
  }
}

export const api = new MemoryMatchAPI();
```

**Usage in React Component:**
```typescript
import { api } from './api';

// After game ends
async function handleGameEnd(gameData: GameResult) {
  try {
    await api.saveGameResult(gameData);
    const stats = await api.getUserStats(gameData.user_id);
    console.log('User stats:', stats);
  } catch (error) {
    console.error('Failed to save game result:', error);
  }
}
```

---

## 14. Conclusion

This backend server provides a solid foundation for the Memory Match game with:

✅ **RESTful API** design following best practices  
✅ **Database schema** optimized for game data storage  
✅ **User management** with statistics tracking  
✅ **Leaderboard** functionality for competition  
✅ **Scalable architecture** ready for production deployment  
✅ **Security considerations** for safe operation  
✅ **Clear documentation** for developers  

The design is intentionally simple and focused, making it easy to understand, maintain, and extend as requirements evolve.

---

## Appendix A: Quick Reference

### Database Tables
- `users` - Player accounts
- `game_results` - Historical game data

### API Endpoints
```
GET  /health                          # Server health
POST /api/users                       # Create user
GET  /api/users/<username>            # Get user
GET  /api/users                       # List users
POST /api/results                     # Save result
GET  /api/results/user/<id>           # Get user results
GET  /api/results/user/<id>/stats     # Get user stats
GET  /api/leaderboard                 # Get leaderboard
```

### Technology Stack
- Python 3.8+
- Flask 3.0.0
- SQLAlchemy (ORM)
- SQLite (dev) / PostgreSQL (prod)
- Flask-CORS

### File Structure
```
backend/
├── app.py              # Main application
├── models.py           # Database models
├── requirements.txt    # Dependencies
├── README.md          # Setup guide
├── DESIGN.md          # This document
└── .gitignore         # Git ignore rules
```

---

## Appendix B: Visual Diagrams

Below are multiple complementary diagrams to help you visualize the components, request flow, and data paths of the backend. You can copy these into tools that support Mermaid (e.g., Markdown previewers with Mermaid) or use the ASCII versions directly.

### B.1 High-Level Component Map (Flowchart)
```mermaid
flowchart TB
  subgraph Client[Frontend Application]
    A[React/TypeScript<br/>Mobile Web App]
  end

  A -->|HTTP/HTTPS<br/>JSON Requests| B

  subgraph Flask[Flask Backend Server]
    B[API Layer<br/>app.py]
    C[Business Logic Layer<br/>Input Validation<br/>Data Processing<br/>Statistics Calculation]
    D[ORM Layer<br/>models.py<br/>User & GameResult Models]
    
    B -->|CORS Check<br/>Route to Handler| C
    C -->|Query/Persist Data| D
  end

  D -->|SQLAlchemy ORM| E

  subgraph DB[Database Layer]
    E[(SQLite/PostgreSQL)]
    E1[users table]
    E2[game_results table]
    
    E -.contains.- E1
    E -.contains.- E2
  end

  style A fill:#b3d9ff,stroke:#333,stroke-width:2px,color:#000
  style B fill:#ffd699,stroke:#333,stroke-width:2px,color:#000
  style C fill:#ffb3d9,stroke:#333,stroke-width:2px,color:#000
  style D fill:#b3ffb3,stroke:#333,stroke-width:2px,color:#000
  style E fill:#d9d9d9,stroke:#333,stroke-width:2px,color:#000
```

### B.2 End-to-End Request Lifecycle (Sequence Diagram)
```mermaid
sequenceDiagram
  participant FE as Frontend<br/>(React/TypeScript)
  participant API as Flask API<br/>(app.py routes)
  participant Logic as Business Logic<br/>(Validation & Processing)
  participant ORM as SQLAlchemy<br/>(Models)
  participant DB as Database<br/>(SQLite/PostgreSQL)

  Note over FE,DB: Save Game Result Flow
  FE->>API: POST /api/results<br/>{user_id, score, moves, time_taken}
  API->>API: CORS validation
  API->>Logic: Validate required fields
  Logic->>Logic: Check field types & values
  Logic->>ORM: Create GameResult instance
  ORM->>DB: INSERT INTO game_results
  DB-->>ORM: Return new result ID
  ORM-->>Logic: GameResult object
  Logic-->>API: Result data
  API-->>FE: 201 Created<br/>{id, score, played_at, ...}

  Note over FE,DB: Get Leaderboard Flow
  FE->>API: GET /api/leaderboard?limit=10
  API->>Logic: Process leaderboard request
  Logic->>ORM: Query with GROUP BY user_id<br/>ORDER BY MAX(score) DESC
  ORM->>DB: SELECT with aggregation
  DB-->>ORM: Result rows
  ORM-->>Logic: User rankings list
  Logic-->>API: Leaderboard data
  API-->>FE: 200 OK<br/>{leaderboard: [...]}
```

### B.3 API Endpoints Overview (Graph)
```mermaid
graph TB
  subgraph API[API Endpoints - app.py]
    H[GET /health<br/>Health Check]
    
    subgraph Users[User Management]
      U1[POST /api/users<br/>Create User]
      U2[GET /api/users/username<br/>Get User by Name]
      U3[GET /api/users<br/>Get All Users]
    end
    
    subgraph Results[Game Results]
      R1[POST /api/results<br/>Save Game Result]
      R2[GET /api/results/user/id<br/>Get User History]
      R3[GET /api/results/user/id/stats<br/>Get User Statistics]
    end
    
    subgraph Leaderboard[Leaderboard]
      L1[GET /api/leaderboard<br/>Get Top Players]
    end
  end

  subgraph Models[Database Models]
    M1[User Model<br/>id, username, created_at]
    M2[GameResult Model<br/>id, user_id, score, moves,<br/>time_taken, difficulty,<br/>grid_size, completed, played_at]
  end

  U1 --> M1
  U2 --> M1
  U3 --> M1
  R1 --> M2
  R2 --> M2
  R3 --> M2
  L1 --> M1
  L1 --> M2
  
  M2 -.foreign key.-> M1

  style H fill:#90EE90,stroke:#333,stroke-width:2px,color:#000
  style U1 fill:#FFD699,stroke:#333,stroke-width:2px,color:#000
  style U2 fill:#FFD699,stroke:#333,stroke-width:2px,color:#000
  style U3 fill:#FFD699,stroke:#333,stroke-width:2px,color:#000
  style R1 fill:#87CEEB,stroke:#333,stroke-width:2px,color:#000
  style R2 fill:#87CEEB,stroke:#333,stroke-width:2px,color:#000
  style R3 fill:#87CEEB,stroke:#333,stroke-width:2px,color:#000
  style L1 fill:#DDA0DD,stroke:#333,stroke-width:2px,color:#000
  style M1 fill:#FFB6C1,stroke:#333,stroke-width:2px,color:#000
  style M2 fill:#FFB6C1,stroke:#333,stroke-width:2px,color:#000
```

### B.4 Request Flow for Key Use Cases
```mermaid
flowchart LR
  subgraph Frontend[Frontend Actions]
    FE1[Create User]
    FE2[Save Game Result]
    FE3[View Stats]
    FE4[View Leaderboard]
  end

  subgraph API[API Layer]
    A1[POST /api/users]
    A2[POST /api/results]
    A3[GET /api/results/user/id/stats]
    A4[GET /api/leaderboard]
  end

  subgraph Logic[Business Logic]
    B1[Validate Username<br/>Check if Exists]
    B2[Validate Fields<br/>user_id, score, moves, time]
    B3[Calculate Averages<br/>Best Score, Total Games]
    B4[Aggregate Best Scores<br/>Rank Users]
  end

  subgraph Database[(Database)]
    D1[(users table)]
    D2[(game_results table)]
  end

  FE1 -->|username| A1 -->|check/create| B1 -->|INSERT/SELECT| D1
  FE2 -->|game data| A2 -->|validate| B2 -->|INSERT| D2
  FE3 -->|user_id| A3 -->|compute| B3 -->|SELECT with GROUP BY| D2
  FE4 -->|limit param| A4 -->|aggregate| B4 -->|JOIN & GROUP BY| D1
  B4 --> D2
  
  D1 -->|response| FE1
  D2 -->|response| FE2
  B3 -->|stats JSON| FE3
  B4 -->|leaderboard JSON| FE4

  style FE1 fill:#b3d9ff,stroke:#333,stroke-width:2px,color:#000
  style FE2 fill:#b3d9ff,stroke:#333,stroke-width:2px,color:#000
  style FE3 fill:#b3d9ff,stroke:#333,stroke-width:2px,color:#000
  style FE4 fill:#b3d9ff,stroke:#333,stroke-width:2px,color:#000
```

### B.5 Entity Relationship (ER) Diagram
```mermaid
erDiagram
  USER ||--o{ GAME_RESULT : "has many"
  
  USER {
    int id PK "Primary Key"
    string username UK "Unique, max 80 chars"
    datetime created_at "Default: now()"
  }
  
  GAME_RESULT {
    int id PK "Primary Key"
    int user_id FK "Foreign Key -> USER.id"
    int score "Game score"
    int moves "Number of moves"
    int time_taken "Time in seconds"
    string difficulty "easy/medium/hard"
    string grid_size "e.g., 4x4, 6x6"
    boolean completed "Default: true"
    datetime played_at "Default: now()"
  }
```

### B.6 Request Flow Visualization (ASCII)
```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│            (React/TypeScript - Mobile Web)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ 1. HTTP/HTTPS JSON Request
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                      Flask API Layer                          │
│                         (app.py)                              │
│  - Route matching                                             │
│  - CORS validation                                            │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ 2. Request validation & processing
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                        │
│  - Input validation (required fields, types)                  │
│  - Data processing & transformation                           │
│  - Statistics calculation                                     │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ 3. Database operations
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                     ORM Layer (models.py)                     │
│  - User Model                                                 │
│  - GameResult Model                                           │
│  - Relationships & Constraints                                │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ 4. SQLAlchemy executes SQL
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                   Database Layer                              │
│               (SQLite / PostgreSQL)                           │
│  ┌─────────────────┐         ┌──────────────────────┐        │
│  │   users table   │────────▶│  game_results table  │        │
│  │  - id (PK)      │  1:N    │  - id (PK)           │        │
│  │  - username     │         │  - user_id (FK)      │        │
│  │  - created_at   │         │  - score, moves      │        │
│  └─────────────────┘         │  - time_taken, etc.  │        │
│                              └──────────────────────┘        │
└───────────────────────────────────────────────────────────────┘
```

### B.7 Database Schema with Indexes
```mermaid
graph TB
  subgraph Database[SQLite / PostgreSQL Database]
    subgraph UT[users Table]
      U1[id - INTEGER PRIMARY KEY]
      U2[username - VARCHAR 80 UNIQUE]
      U3[created_at - DATETIME]
      UI1[Index: PK on id]
      UI2[Index: UNIQUE on username]
    end
    
    subgraph GRT[game_results Table]
      G1[id - INTEGER PRIMARY KEY]
      G2[user_id - INTEGER FOREIGN KEY]
      G3[score - INTEGER NOT NULL]
      G4[moves - INTEGER NOT NULL]
      G5[time_taken - INTEGER NOT NULL]
      G6[difficulty - VARCHAR 20]
      G7[grid_size - VARCHAR 10]
      G8[completed - BOOLEAN DEFAULT TRUE]
      G9[played_at - DATETIME]
      GI1[Index: PK on id]
      GI2[Index: FK on user_id]
      GI3[Index: on played_at for sorting]
      GI4[Composite Index: user_id, score]
    end
  end
  
  G2 -.->|Foreign Key| U1
  
  style U1 fill:#FFD699,stroke:#333,stroke-width:2px,color:#000
  style G1 fill:#87CEEB,stroke:#333,stroke-width:2px,color:#000
  style G2 fill:#FFB6C1,stroke:#333,stroke-width:2px,color:#000
  style UI1 fill:#90EE90,stroke:#333,stroke-width:2px,color:#000
  style UI2 fill:#90EE90,stroke:#333,stroke-width:2px,color:#000
  style GI1 fill:#90EE90,stroke:#333,stroke-width:2px,color:#000
  style GI2 fill:#90EE90,stroke:#333,stroke-width:2px,color:#000
  style GI3 fill:#90EE90,stroke:#333,stroke-width:2px,color:#000
  style GI4 fill:#90EE90,stroke:#333,stroke-width:2px,color:#000
```

### B.8 Statistics Calculation Flow
```mermaid
flowchart TD
  Start[GET /api/results/user/id/stats] --> Validate{User Exists?}
  Validate -->|No| Return404[Return 404<br/>User not found]
  Validate -->|Yes| Query[Query all GameResults<br/>for user_id]
  Query --> Check{Has Results?}
  Check -->|No| ReturnZero[Return stats<br/>with zero values]
  Check -->|Yes| Calculate[Calculate Statistics]
  
  Calculate --> C1[Total Games = COUNT]
  Calculate --> C2[Average Score = SUM/COUNT]
  Calculate --> C3[Average Moves = SUM/COUNT]
  Calculate --> C4[Average Time = SUM/COUNT]
  Calculate --> C5[Best Score = MAX]
  Calculate --> C6[Total Time = SUM]
  
  C1 --> Format[Format Response]
  C2 --> Format
  C3 --> Format
  C4 --> Format
  C5 --> Format
  C6 --> Format
  
  Format --> Return200[Return 200 OK<br/>with stats JSON]
  ReturnZero --> Return200
  
  style Start fill:#b3d9ff,stroke:#333,stroke-width:2px,color:#000
  style Return200 fill:#90EE90,stroke:#333,stroke-width:2px,color:#000
  style Return404 fill:#FFB6C1,stroke:#333,stroke-width:2px,color:#000
  style Calculate fill:#FFD699,stroke:#333,stroke-width:2px,color:#000
```

### B.9 Leaderboard Query Flow
```mermaid
flowchart TD
  Start[GET /api/leaderboard?limit=10] --> Query[Execute SQL Query]
  
  Query --> SQL["SELECT<br/>user.id, user.username,<br/>MAX(result.score) as best_score,<br/>COUNT(result.id) as total_games<br/>FROM users<br/>JOIN game_results ON user.id = result.user_id<br/>GROUP BY user.id<br/>ORDER BY best_score DESC<br/>LIMIT 10"]
  
  SQL --> Process[Process Results]
  Process --> Rank[Add Rank Numbers<br/>1, 2, 3, ...]
  Rank --> Format[Format as JSON Array]
  Format --> Return[Return 200 OK<br/>with leaderboard data]
  
  style Start fill:#b3d9ff,stroke:#333,stroke-width:2px,color:#000
  style SQL fill:#FFD699,stroke:#333,stroke-width:2px,color:#000
  style Return fill:#90EE90,stroke:#333,stroke-width:2px,color:#000
```

### B.10 Production Deployment Architecture
```mermaid
flowchart TB
  subgraph Internet
    Client[Web/Mobile Clients]
  end
  
  Client -->|HTTPS| LB[Load Balancer<br/>nginx/HAProxy]
  
  LB --> App1[Flask App<br/>Instance 1<br/>Gunicorn]
  LB --> App2[Flask App<br/>Instance 2<br/>Gunicorn]
  LB --> App3[Flask App<br/>Instance 3<br/>Gunicorn]
  
  App1 --> Cache[(Redis Cache<br/>Leaderboard & Stats)]
  App2 --> Cache
  App3 --> Cache
  
  App1 --> DB[(PostgreSQL<br/>Primary)]
  App2 --> DB
  App3 --> DB
  
  DB --> Replica[(PostgreSQL<br/>Read Replica)]
  
  App1 -.read queries.-> Replica
  App2 -.read queries.-> Replica
  App3 -.read queries.-> Replica
  
  subgraph Monitoring
    Logs[Log Aggregation<br/>ELK/Splunk]
    Metrics[Metrics<br/>Prometheus/Grafana]
  end
  
  App1 -.logs/metrics.-> Logs
  App1 -.logs/metrics.-> Metrics
  
  style Client fill:#b3d9ff,stroke:#333,stroke-width:2px,color:#000
  style LB fill:#FFD699,stroke:#333,stroke-width:2px,color:#000
  style Cache fill:#DDA0DD,stroke:#333,stroke-width:2px,color:#000
  style DB fill:#90EE90,stroke:#333,stroke-width:2px,color:#000
  style Replica fill:#87CEEB,stroke:#333,stroke-width:2px,color:#000
```

### Diagram Guide
- **Diagram B.1**: Overall system architecture showing layers
- **Diagram B.2**: Request/response flow with sequence
- **Diagram B.3**: API endpoints mapped to data models
- **Diagram B.4**: Use case flows for common operations
- **Diagram B.5**: Database entity relationships
- **Diagram B.6**: ASCII visualization of request flow
- **Diagram B.7**: Database schema with indexes
- **Diagram B.8**: Statistics calculation logic
- **Diagram B.9**: Leaderboard aggregation query
- **Diagram B.10**: Production deployment setup

### How to Use These Diagrams

1. **Copy to Markdown Preview**: Paste into any Mermaid-compatible viewer (GitHub, VS Code with Mermaid extension, etc.)
2. **Interactive Editing**: Use [Mermaid Live Editor](https://mermaid.live/) to customize
3. **Documentation**: Include in your project README or design docs
4. **Presentations**: Export as images for slides and presentations

**Tools that support Mermaid:**
- GitHub Markdown
- VS Code (with Mermaid extension)
- GitLab Markdown
- Notion
- Confluence (with plugins)
- Mermaid Live Editor (https://mermaid.live/)

---

**Document Version:** 1.0  
**Last Updated:** November 1, 2025  
**Author:** Memory Match Development Team
