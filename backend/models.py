from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime

# Enums
class EventType(str, enum.Enum):
    MONETARY_POLICY = "monetary_policy"
    FRAUD = "fraud"
    MERGER = "merger"
    LEGAL = "legal"
    EARNINGS = "earnings"
    MACRO_EVENT = "macro_event"
    REGULATORY = "regulatory"
    CREDIT_RATING = "credit_rating"
    BANKRUPTCY = "bankruptcy"
    GEOPOLITICAL = "geopolitical"

class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ImpactDuration(str, enum.Enum):
    SHORT = "short_term"
    MEDIUM = "medium_term"
    LONG = "long_term"

# News Event Model
class NewsEvent(Base):
    __tablename__ = "news_events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    source = Column(String(200))
    url = Column(String(500), unique=True, index=True)
    published_at = Column(DateTime, default=datetime.utcnow)
    
    # AI predictions
    event_type = Column(String(50), nullable=True)
    event_type_confidence = Column(Float, default=0.0)
    risk_level = Column(String(20), nullable=True)
    risk_score = Column(Float, default=0.0)
    impact_duration = Column(String(20), nullable=True)
    
    # Metadata
    processed_at = Column(DateTime, default=datetime.utcnow)
    is_alert_sent = Column(Integer, default=0)
    content_hash = Column(String(64), unique=True, nullable=True, index=True)

# User Model for Authentication
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    company = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with preferences
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")

# User Preferences Model
class UserPreference(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    user_type = Column(String(50), default="bank")
    risk_threshold = Column(String(20), default="medium")
    tracked_companies = Column(Text, default="[]")  # JSON array
    email_alerts = Column(Integer, default=0)  # 0=off, 1=on
    dark_mode = Column(Integer, default=0)  # 0=off, 1=on
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="preferences")