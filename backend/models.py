from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    """User model to store user information"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationship to game results
    game_results = db.relationship('GameResult', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


class GameResult(db.Model):
    """GameResult model to store historical game results"""
    __tablename__ = 'game_results'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Game statistics
    score = db.Column(db.Integer, nullable=False)
    moves = db.Column(db.Integer, nullable=False)
    time_taken = db.Column(db.Integer, nullable=False)  # in seconds
    difficulty = db.Column(db.String(20))  # easy, medium, hard
    grid_size = db.Column(db.String(10))  # e.g., "4x4", "6x6"
    
    # Metadata
    completed = db.Column(db.Boolean, default=True)
    played_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'score': self.score,
            'moves': self.moves,
            'time_taken': self.time_taken,
            'difficulty': self.difficulty,
            'grid_size': self.grid_size,
            'completed': self.completed,
            'played_at': self.played_at.isoformat()
        }
