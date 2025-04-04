from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import models
from database import get_db
import secrets
import string

# Security configuration
SECRET_KEY = "your-secret-key-keep-it-secret"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
PASSWORD_RESET_TOKEN_EXPIRE_HOURS = 24

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_password_reset_token(email: str) -> str:
    """Create a secure token for password reset."""
    # Create a random token
    alphabet = string.ascii_letters + string.digits
    token = ''.join(secrets.choice(alphabet) for _ in range(64))
    
    # Store in JWT with email and expiration
    expires = datetime.utcnow() + timedelta(hours=PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
    jwt_data = {
        "sub": email,
        "exp": expires,
        "type": "password_reset",
        "reset_token": token
    }
    
    return jwt.encode(jwt_data, SECRET_KEY, algorithm=ALGORITHM)

def verify_password_reset_token(token: str, email: str) -> bool:
    """Verify that a password reset token is valid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_email = payload.get("sub")
        token_type = payload.get("type")
        
        # Check token type and email match
        if token_type != "password_reset" or token_email != email:
            return False
            
        # Token is valid
        return True
    except JWTError:
        return False

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"Decoding token: {token[:10]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            print("Token missing 'sub' claim")
            raise credentials_exception
        print(f"Token contains email: {email}")
    except JWTError as e:
        print(f"JWT error: {e}")
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        print(f"No user found with email: {email}")
        raise credentials_exception
    
    print(f"User found: {user.email}, is_superuser: {user.is_superuser}")
    return user

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate user with email and password."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user 