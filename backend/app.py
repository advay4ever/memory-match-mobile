from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, GameResult
from auth import AuthService
from datetime import datetime
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///memory_match.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Backend server is running'}), 200


# Authentication endpoints
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user with email and password"""
    data = request.get_json()
    
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')
    
    if not email or not username or not password:
        return jsonify({'error': 'Email, username, and password are required'}), 400
    
    # Validate email format
    import re
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409
    
    # Validate password length
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    try:
        # Create new user
        password_hash = AuthService.hash_password(password)
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            last_login=datetime.utcnow()
        )
        db.session.add(user)
        db.session.commit()
        
        # Generate JWT
        token = AuthService.generate_jwt(user.id)
        
        return jsonify({
            'user': user.to_dict(),
            'token': token,
            'message': 'Registration successful'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user with email and password"""
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    try:
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Verify password
        if not AuthService.verify_password(user.password_hash, password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate JWT
        token = AuthService.generate_jwt(user.id)
        
        return jsonify({
            'user': user.to_dict(),
            'token': token,
            'message': 'Login successful'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


# User endpoints
@app.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user"""
    data = request.get_json()
    
    if not data or 'username' not in data:
        return jsonify({'error': 'Username is required'}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify(existing_user.to_dict()), 200
    
    # Create new user
    user = User(username=data['username'], auth_provider='username')
    db.session.add(user)
    db.session.commit()
    
    return jsonify(user.to_dict()), 201


@app.route('/api/users/<username>', methods=['GET'])
def get_user(username):
    """Get user by username"""
    user = User.query.filter_by(username=username).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200


@app.route('/api/users', methods=['GET'])
def get_all_users():
    """Get all users"""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200


# Game Results endpoints
@app.route('/api/results', methods=['POST'])
def save_result():
    """Save a game result"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['user_id', 'score', 'moves', 'time_taken']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Create game result
    result = GameResult(
        user_id=data['user_id'],
        score=data['score'],
        moves=data['moves'],
        time_taken=data['time_taken'],
        difficulty=data.get('difficulty', 'medium'),
        grid_size=data.get('grid_size', '4x4'),
        completed=data.get('completed', True)
    )
    
    db.session.add(result)
    db.session.commit()
    
    return jsonify(result.to_dict()), 201


@app.route('/api/results/user/<int:user_id>', methods=['GET'])
def get_user_results(user_id):
    """Get all results for a specific user"""
    # Check if user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get query parameters for filtering
    limit = request.args.get('limit', type=int)
    difficulty = request.args.get('difficulty')
    
    # Build query
    query = GameResult.query.filter_by(user_id=user_id)
    
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    
    # Order by most recent first
    query = query.order_by(GameResult.played_at.desc())
    
    if limit:
        query = query.limit(limit)
    
    results = query.all()
    
    return jsonify({
        'user': user.to_dict(),
        'results': [result.to_dict() for result in results],
        'total_games': len(results)
    }), 200


@app.route('/api/results/user/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    """Get statistics for a specific user"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    results = GameResult.query.filter_by(user_id=user_id).all()
    
    if not results:
        return jsonify({
            'user': user.to_dict(),
            'stats': {
                'total_games': 0,
                'average_score': 0,
                'average_moves': 0,
                'average_time': 0,
                'best_score': 0,
                'total_time_played': 0
            }
        }), 200
    
    total_games = len(results)
    total_score = sum(r.score for r in results)
    total_moves = sum(r.moves for r in results)
    total_time = sum(r.time_taken for r in results)
    best_score = max(r.score for r in results)
    
    stats = {
        'total_games': total_games,
        'average_score': round(total_score / total_games, 2),
        'average_moves': round(total_moves / total_games, 2),
        'average_time': round(total_time / total_games, 2),
        'best_score': best_score,
        'total_time_played': total_time
    }
    
    return jsonify({
        'user': user.to_dict(),
        'stats': stats
    }), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
