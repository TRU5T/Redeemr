from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from auth_utils import get_password_hash

def create_test_user():
    db = SessionLocal()
    try:
        # Check if test user already exists
        test_user = db.query(models.User).filter(models.User.email == "test@example.com").first()
        if test_user:
            print("Test user already exists!")
            return
        
        # Create test user
        hashed_password = get_password_hash("password123")
        test_user = models.User(
            email="test@example.com",
            name="Test User",
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=True
        )
        db.add(test_user)
        db.commit()
        print("Test user created successfully!")
        print("Email: test@example.com")
        print("Password: password123")
    except Exception as e:
        print(f"Error creating test user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user() 