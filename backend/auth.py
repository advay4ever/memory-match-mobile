import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import os

class AuthService:
    JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION_DAYS = 7
    
    @staticmethod
    def hash_password(password):
        """Hash a password for storing"""
        return generate_password_hash(password)
    
    @staticmethod
    def verify_password(password_hash, password):
        """Verify a stored password against one provided by user"""
        return check_password_hash(password_hash, password)
    
    @staticmethod
    def generate_jwt(user_id):
        """Generate JWT for authenticated user"""
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=AuthService.JWT_EXPIRATION_DAYS),
            'iat': datetime.utcnow(),
        }
        return jwt.encode(payload, AuthService.JWT_SECRET, algorithm=AuthService.JWT_ALGORITHM)
    
    @staticmethod
    def verify_jwt(token):
        """Verify JWT and return user_id"""
        try:
            payload = jwt.decode(token, AuthService.JWT_SECRET, algorithms=[AuthService.JWT_ALGORITHM])
            return payload['user_id']
        except jwt.ExpiredSignatureError:
            raise Exception('Token expired')
        except jwt.InvalidTokenError:
            raise Exception('Invalid token')
