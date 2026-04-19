from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    company: Optional[str] = None
    user_type: str = "bank"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    company: Optional[str] = None
    created_at: Optional[str] = None
    
    class Config:
        from_attributes = True

# Preference Schemas
class UserPreferenceUpdate(BaseModel):
    user_type: Optional[str] = None
    risk_threshold: Optional[str] = None
    tracked_companies: Optional[List[str]] = None
    email_alerts: Optional[int] = None
    dark_mode: Optional[int] = None

class UserPreferenceResponse(BaseModel):
    user_type: str
    risk_threshold: str
    tracked_companies: List[str]
    email_alerts: int
    dark_mode: int
    
    class Config:
        from_attributes = True

# Token Schema
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict
    preferences: dict