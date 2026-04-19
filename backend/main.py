from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from database import engine
import models
from services.news_service import news_fetcher
from services.prediction_service import prediction_service

# Import routes
from routes import events, auth, reports

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Scheduler
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Financial Risk Intelligence Platform")
    scheduler.add_job(
        func=news_fetcher.fetch_and_process,
        trigger="interval",
        minutes=1,
        id="news_fetcher",
        replace_existing=True
    )
    scheduler.start()
    print("✅ Background scheduler started - Fetching news every 1 minute")
    yield
    scheduler.shutdown()
    print("👋 Shutting down")

# Create app
app = FastAPI(
    title="Financial Risk Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ ROUTES - YE LINES EXACTLY AISI HONI CHAHIYE!
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(reports.router)  # reports.py mein prefix already defined hai

@app.get("/")
async def root():
    return {
        "message": "Financial Risk Intelligence Platform",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    from sqlalchemy import text
    db_status = "disconnected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        db_status = f"error"
    return {
        "status": "healthy",
        "database": db_status,
        "models": "loaded" if prediction_service.event_classifier else "missing",
        "version": "1.0.0"
    }