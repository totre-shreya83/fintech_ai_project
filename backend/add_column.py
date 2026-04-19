from database import SessionLocal, engine
from sqlalchemy import text

def add_content_hash_column():
    """Add content_hash column to news_events table"""
    
    db = SessionLocal()
    
    try:
        # ✅ Check if column already exists
        result = db.execute(text("PRAGMA table_info(news_events)"))
        columns = [row[1] for row in result]
        
        if 'content_hash' in columns:
            print("✅ content_hash column already exists")
            return
        
        # ✅ Add column - SQLite ALTER TABLE syntax
        db.execute(text(
            "ALTER TABLE news_events ADD COLUMN content_hash VARCHAR(64) UNIQUE"
        ))
        db.commit()
        print("✅ content_hash column added successfully!")
        
        # ✅ Verify
        result = db.execute(text("PRAGMA table_info(news_events)"))
        columns = [row[1] for row in result]
        if 'content_hash' in columns:
            print("✅ Verified: content_hash column exists")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()
        print("🔒 Database session closed")

if __name__ == "__main__":
    add_content_hash_column()