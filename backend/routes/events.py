from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models

router = APIRouter()

@router.get("/stats")
async def get_event_stats(db: Session = Depends(get_db)):
    """Get event statistics"""
    try:
        # Simple counts
        total = db.query(models.NewsEvent).count()
        
        # Risk level counts
        critical = db.query(models.NewsEvent).filter(models.NewsEvent.risk_level == "critical").count()
        high = db.query(models.NewsEvent).filter(models.NewsEvent.risk_level == "high").count()
        medium = db.query(models.NewsEvent).filter(models.NewsEvent.risk_level == "medium").count()
        low = db.query(models.NewsEvent).filter(models.NewsEvent.risk_level == "low").count()
        
        # Event type distribution
        event_types = db.query(
            models.NewsEvent.event_type,
            func.count(models.NewsEvent.event_type).label('count')
        ).filter(
            models.NewsEvent.event_type.isnot(None)
        ).group_by(
            models.NewsEvent.event_type
        ).all()
        
        return {
            "total_events": total,
            "risk_distribution": {
                "critical": critical,
                "high": high,
                "medium": medium,
                "low": low
            },
            "event_type_distribution": [
                {"type": et[0], "count": et[1]} 
                for et in event_types
            ]
        }
    except Exception as e:
        print(f"Stats error: {e}")
        return {
            "error": str(e),
            "total_events": 0,
            "risk_distribution": {
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0
            },
            "event_type_distribution": []
        }

@router.get("/")
async def get_events(db: Session = Depends(get_db)):
    """Get all events"""
    try:
        events = db.query(models.NewsEvent).order_by(
            models.NewsEvent.published_at.desc()
        ).limit(50).all()
        
        return {
            "total": len(events),
            "events": [
                {
                    "id": e.id,
                    "title": e.title,
                    "description": e.description,
                    "source": e.source,
                    "risk_level": e.risk_level,
                    "event_type": e.event_type,
                    "confidence": round(e.event_type_confidence * 100, 2) if e.event_type_confidence else 0,
                    "impact_duration": e.impact_duration,
                    "is_alert": bool(e.is_alert_sent),
                    "published_at": e.published_at.isoformat() if e.published_at else None
                }
                for e in events
            ]
        }
    except Exception as e:
        print(f"Events error: {e}")
        return {"error": str(e), "events": []}

@router.get("/critical")
async def get_critical_events(db: Session = Depends(get_db)):
    """Get critical risk events"""
    try:
        events = db.query(models.NewsEvent).filter(
            models.NewsEvent.risk_level == "critical"
        ).order_by(models.NewsEvent.published_at.desc()).all()
        
        return {
            "total": len(events),
            "events": [
                {
                    "id": e.id,
                    "title": e.title,
                    "description": e.description[:200] if e.description else "",
                    "event_type": e.event_type,
                    "source": e.source,
                    "published_at": e.published_at.isoformat() if e.published_at else None
                }
                for e in events
            ]
        }
    except Exception as e:
        print(f"Critical events error: {e}")
        return {"error": str(e), "events": []}

@router.get("/history")
async def get_event_history(days: int = 7, db: Session = Depends(get_db)):
    """Get event history for trends"""
    try:
        from datetime import datetime, timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        events = db.query(models.NewsEvent).filter(
            models.NewsEvent.published_at >= cutoff_date
        ).order_by(models.NewsEvent.published_at.desc()).all()
        
        # Group by date
        from collections import defaultdict
        daily_counts = defaultdict(int)
        risk_counts = defaultdict(lambda: defaultdict(int))
        
        for event in events:
            date_str = event.published_at.strftime('%Y-%m-%d') if event.published_at else 'Unknown'
            daily_counts[date_str] += 1
            
            if event.risk_level:
                risk_counts[date_str][event.risk_level] += 1
        
        # Format for charts
        timeline = []
        for date in sorted(daily_counts.keys()):
            timeline.append({
                "date": date,
                "total": daily_counts[date],
                "critical": risk_counts[date].get("critical", 0),
                "high": risk_counts[date].get("high", 0),
                "medium": risk_counts[date].get("medium", 0),
                "low": risk_counts[date].get("low", 0)
            })
        
        return {
            "days": days,
            "total_events": len(events),
            "timeline": timeline
        }
    except Exception as e:
        print(f"History error: {e}")
        return {"error": str(e), "timeline": []}