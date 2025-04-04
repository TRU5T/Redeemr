from database import engine, SessionLocal, get_db
from sqlalchemy import Column, Boolean, Integer, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import text
import models

print("Updating database schema...")

# Create a database session
db = SessionLocal()

try:
    # Check if is_business_owner column exists in users table
    try:
        db.execute(text("SELECT is_business_owner FROM users LIMIT 1"))
        print("Column 'is_business_owner' already exists in users table")
    except Exception:
        print("Adding 'is_business_owner' column to users table")
        db.execute(text("ALTER TABLE users ADD COLUMN is_business_owner BOOLEAN DEFAULT FALSE"))
        db.commit()
    
    # Check if owner_id column exists in businesses table
    try:
        db.execute(text("SELECT owner_id FROM businesses LIMIT 1"))
        print("Column 'owner_id' already exists in businesses table")
    except Exception:
        print("Adding 'owner_id' column to businesses table")
        db.execute(text("ALTER TABLE businesses ADD COLUMN owner_id INTEGER REFERENCES users(id)"))
        db.commit()
    
    # Check if is_approved column exists in businesses table
    try:
        db.execute(text("SELECT is_approved FROM businesses LIMIT 1"))
        print("Column 'is_approved' already exists in businesses table")
    except Exception:
        print("Adding 'is_approved' column to businesses table")
        db.execute(text("ALTER TABLE businesses ADD COLUMN is_approved BOOLEAN DEFAULT FALSE"))
        db.commit()
    
    print("Database schema updated successfully!")
except Exception as e:
    db.rollback()
    print(f"Error updating database schema: {e}")
finally:
    db.close() 