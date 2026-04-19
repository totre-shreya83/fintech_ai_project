from database import SessionLocal
import models
from sqlalchemy import text

def clean_duplicates():
    """Clean duplicate entries from database"""
    
    # ✅ Create fresh session
    db = SessionLocal()
    
    try:
        # ✅ Check if content_hash column exists
        result = db.execute(text("PRAGMA table_info(news_events)"))
        columns = [row[1] for row in result]
        
        if 'content_hash' not in columns:
            print("❌ content_hash column does not exist!")
            print("Please run add_column.py first")
            return
        
        print("🔍 Finding duplicates...")
        
        # ✅ Get all events ordered by date (newest first)
        all_events = db.query(models.NewsEvent).order_by(
            models.NewsEvent.published_at.desc()
        ).all()
        
        print(f"📊 Total events in database: {len(all_events)}")
        
        url_seen = {}
        to_delete = []
        keep_count = 0
        
        for event in all_events:
            # Keep first occurrence (newest), delete duplicates
            if event.url not in url_seen:
                url_seen[event.url] = event.id
                keep_count += 1
            else:
                to_delete.append(event.id)
                print(f"  ❌ Duplicate URL: {event.title[:50]}... (ID: {event.id})")
        
        # ✅ Delete duplicates
        if to_delete:
            print(f"\n🗑️ Deleting {len(to_delete)} duplicate entries...")
            delete_query = db.query(models.NewsEvent).filter(
                models.NewsEvent.id.in_(to_delete)
            )
            delete_count = delete_query.delete(synchronize_session=False)
            db.commit()
            print(f"✅ Deleted {delete_count} duplicates")
        else:
            print("✅ No duplicate URLs found!")
        
        # ✅ Show final count
        final_count = db.query(models.NewsEvent).count()
        print(f"\n📊 Total unique events: {final_count}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        # ✅ Always close session
        db.close()
        print("🔒 Database session closed")

if __name__ == "__main__":
    clean_duplicates()