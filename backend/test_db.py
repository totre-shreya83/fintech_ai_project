from sqlalchemy import create_engine, text

# Use the same database URL
engine = create_engine("sqlite:///./finance.db", connect_args={"check_same_thread": False})

try:
    # Try to connect
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
        print(f"✅ Query result: {result.fetchone()}")
        
    # Check if file exists
    import os
    if os.path.exists("finance.db"):
        print(f"✅ Database file found at: {os.path.abspath('finance.db')}")
        print(f"✅ File size: {os.path.getsize('finance.db')} bytes")
    else:
        print("❌ Database file not found")
        
except Exception as e:
    print(f"❌ Error: {e}")
    print(f"❌ Error type: {type(e)}")