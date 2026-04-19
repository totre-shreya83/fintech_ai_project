from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import jwt
import json
import hashlib
import os

from database import get_db
import models
import schemas

# ✅ SIMPLE ROUTER - NO PREFIX HERE!
router = APIRouter(tags=["authentication"])

# Security
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Password hashing
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

# Token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

@router.post("/register")
async def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register new user"""
    try:
        # Check if user exists
        existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = hash_password(user_data.password)
        user = models.User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hashed_password,
            company=user_data.company
        )
        db.add(user)
        db.flush()
        
        # Create default preferences
        preferences = models.UserPreference(
            user_id=user.id,
            user_type=user_data.user_type,
            risk_threshold="medium",
            tracked_companies=json.dumps([]),
            email_alerts=0,
            dark_mode=0
        )
        db.add(preferences)
        db.commit()
        db.refresh(user)
        db.refresh(preferences)
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        # Parse tracked_companies for response
        tracked_companies = json.loads(preferences.tracked_companies) if preferences.tracked_companies else []
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "company": user.company,
                "created_at": user.created_at.isoformat() if user.created_at else None
            },
            "preferences": {
                "user_type": preferences.user_type,
                "risk_threshold": preferences.risk_threshold,
                "tracked_companies": tracked_companies,
                "email_alerts": preferences.email_alerts,
                "dark_mode": preferences.dark_mode
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user"""
    try:
        # Find user by email
        user = db.query(models.User).filter(models.User.email == form_data.username).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(form_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get preferences
        preferences = db.query(models.UserPreference).filter(
            models.UserPreference.user_id == user.id
        ).first()
        
        if not preferences:
            # Create default preferences if not exist
            preferences = models.UserPreference(
                user_id=user.id,
                user_type="bank",
                risk_threshold="medium",
                tracked_companies=json.dumps([]),
                email_alerts=0,
                dark_mode=0
            )
            db.add(preferences)
            db.commit()
            db.refresh(preferences)
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        # Parse tracked_companies for response
        tracked_companies = json.loads(preferences.tracked_companies) if preferences.tracked_companies else []
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "company": user.company,
                "created_at": user.created_at.isoformat() if user.created_at else None
            },
            "preferences": {
                "user_type": preferences.user_type,
                "risk_threshold": preferences.risk_threshold,
                "tracked_companies": tracked_companies,
                "email_alerts": preferences.email_alerts,
                "dark_mode": preferences.dark_mode
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
async def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "company": current_user.company,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

@router.get("/preferences")
async def get_user_preferences(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user preferences"""
    preferences = db.query(models.UserPreference).filter(
        models.UserPreference.user_id == current_user.id
    ).first()
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )
    
    tracked_companies = json.loads(preferences.tracked_companies) if preferences.tracked_companies else []
    
    return {
        "user_type": preferences.user_type,
        "risk_threshold": preferences.risk_threshold,
        "tracked_companies": tracked_companies,
        "email_alerts": preferences.email_alerts,
        "dark_mode": preferences.dark_mode
    }

@router.put("/preferences")
async def update_user_preferences(
    preferences_data: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user preferences"""
    preferences = db.query(models.UserPreference).filter(
        models.UserPreference.user_id == current_user.id
    ).first()
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )
    
    if 'user_type' in preferences_data:
        preferences.user_type = preferences_data['user_type']
    if 'risk_threshold' in preferences_data:
        preferences.risk_threshold = preferences_data['risk_threshold']
    if 'tracked_companies' in preferences_data:
        preferences.tracked_companies = json.dumps(preferences_data['tracked_companies'])
    if 'email_alerts' in preferences_data:
        preferences.email_alerts = preferences_data['email_alerts']
    if 'dark_mode' in preferences_data:
        preferences.dark_mode = preferences_data['dark_mode']
    
    preferences.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(preferences)
    
    tracked_companies = json.loads(preferences.tracked_companies) if preferences.tracked_companies else []
    
    return {
        "user_type": preferences.user_type,
        "risk_threshold": preferences.risk_threshold,
        "tracked_companies": tracked_companies,
        "email_alerts": preferences.email_alerts,
        "dark_mode": preferences.dark_mode
    }