from datetime import timedelta
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from pydantic import BaseModel
from database import SessionLocal, engine, get_db
import models, schemas
from auth_utils import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_password_reset_token,
    verify_password_reset_token
)

# Create all tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint for health check
@app.get("/")
def read_root():
    return {"status": "ok", "message": "API is running"}

# Authentication endpoints
@app.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=False,
        is_business_owner=user.is_business_owner
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/auth/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    print(f"Login attempt for email: {user_data.email}")
    user = authenticate_user(db, user_data.email, user_data.password)
    
    if not user:
        print(f"Authentication failed for email: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log user details
    print(f"User authenticated: {user.email}, is_active: {user.is_active}, is_superuser: {user.is_superuser}")
    
    # Update last login time
    user.last_login = func.now()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES * 7 if user_data.remember_me else ACCESS_TOKEN_EXPIRE_MINUTES
    )
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    print(f"Access token generated for {user.email}")
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/auth/password-reset", response_model=dict)
def request_password_reset(email_data: schemas.PasswordReset, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email_data.email).first()
    if user:
        # In a real application, send password reset email here
        return {"message": "If an account exists with this email, a password reset link will be sent."}
    return {"message": "If an account exists with this email, a password reset link will be sent."}

@app.post("/auth/change-password")
def change_password(
    password_data: schemas.PasswordChange,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify current password
    if not authenticate_user(db, current_user.email, password_data.current_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

# Add a business registration endpoint for regular users
@app.post("/businesses/register", response_model=schemas.BusinessResponse)
def register_business(
    business_data: schemas.BusinessRegister,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if the user already has a business
    if db.query(models.Business).filter(models.Business.owner_id == current_user.id).first() and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a registered business."
        )
    
    # Create the business - initially not approved
    business = models.Business(
        name=business_data.name,
        owner_id=current_user.id,
        is_approved=False
    )
    
    db.add(business)
    db.commit()
    db.refresh(business)
    
    # Update user as business owner if not already
    if not current_user.is_business_owner:
        current_user.is_business_owner = True
        db.commit()
    
    return business

# Approve a business (admin only)
@app.post("/businesses/{business_id}/approve")
def approve_business(
    business_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user is superuser
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can approve businesses"
        )
    
    # Find the business
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    # Update approval status
    business.is_approved = True
    db.commit()
    db.refresh(business)
    
    return {"message": f"Business {business.name} has been approved"}

# Reject a business (admin only)
@app.post("/businesses/{business_id}/reject")
def reject_business(
    business_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user is superuser
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can reject businesses"
        )
    
    # Find the business
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    # Delete the business
    db.delete(business)
    db.commit()
    
    return {"message": f"Business {business.name} has been rejected and removed"}

# 1️⃣ Create a Business (admin only)
@app.post("/businesses/")
def create_business(
    name: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"User attempting to create business: {current_user.email}, is_superuser: {current_user.is_superuser}")
    
    if not current_user.is_superuser:
        print(f"Permission denied: user {current_user.email} is not a superuser")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create businesses. Superuser privileges required."
        )
    
    try:
        business = models.Business(name=name)
        db.add(business)
        db.commit()
        db.refresh(business)
        print(f"Business created successfully: {business.id}")
        return business
    except Exception as e:
        print(f"Error creating business: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating business: {str(e)}"
        )

# 2️⃣ Create a Redeemr Reward
@app.post("/rewards/")  
def create_reward(name: str, points_required: int, business_id: int, db: Session = Depends(get_db)):
    reward = models.RedeemrReward(name=name, points_required=points_required, business_id=business_id)
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward

# 3️⃣ List Businesses
@app.get("/businesses/")
def get_businesses(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Only superusers can see all businesses
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view all businesses"
        )
    return db.query(models.Business).all()

# Get the current user's business
@app.get("/businesses/me")
def get_my_business(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if user is a business owner
    if not current_user.is_business_owner and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a business owner"
        )
    
    # Get the user's business
    business = db.query(models.Business).filter(models.Business.owner_id == current_user.id).first()
    
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You don't have a registered business"
        )
    
    return business

# 4️⃣ List Rewards for a Business
@app.get("/businesses/{business_id}/rewards/")
def get_rewards(business_id: int, db: Session = Depends(get_db)):
    return db.query(models.RedeemrReward).filter(models.RedeemrReward.business_id == business_id).all()

# 5️⃣ Register a User
@app.post("/users/")
def create_user(name: str, db: Session = Depends(get_db)):
    user = models.User(name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# 6️⃣ Redeem a Reward
@app.post("/redeem/")
def redeem_reward(user_id: int, reward_id: int, db: Session = Depends(get_db)):
    transaction = models.Transaction(user_id=user_id, reward_id=reward_id)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return {"message": "Reward redeemed!", "transaction": transaction}

# 7️⃣ Delete a Business and All Related Data
@app.delete("/businesses/{business_id}")
def delete_business(business_id: int, db: Session = Depends(get_db)):
    # Delete transactions tied to rewards owned by this business
    rewards = db.query(models.RedeemrReward).filter(models.RedeemrReward.business_id == business_id).all()
    reward_ids = [r.id for r in rewards]
    if reward_ids:
        db.query(models.Transaction).filter(models.Transaction.reward_id.in_(reward_ids)).delete(synchronize_session=False)

    # Delete rewards
    db.query(models.RedeemrReward).filter(models.RedeemrReward.business_id == business_id).delete(synchronize_session=False)

    # Delete the business
    db.query(models.Business).filter(models.Business.id == business_id).delete()

    db.commit()
    return {"message": f"Business {business_id} and related data deleted."}

# Password reset endpoints
@app.post("/request-password-reset/")
def request_password_reset(reset_data: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Initiates the password reset process.
    In a production environment, this would send an email with the reset link.
    """
    user = db.query(models.User).filter(models.User.email == reset_data.email).first()
    
    # Always return success message whether user exists or not (for security)
    # This prevents user enumeration
    if not user:
        print(f"Password reset requested for non-existent user: {reset_data.email}")
        return {"message": "If an account exists with this email, a password reset link will be sent."}
    
    # Generate reset token
    token = create_password_reset_token(user.email)
    
    # In a real application, you would send an email with the reset link
    # For this demo, we'll just log the token and build a URL
    reset_url = f"http://localhost:3000/reset-password?token={token}&email={user.email}"
    print(f"Password reset URL for {user.email}: {reset_url}")
    
    return {"message": "If an account exists with this email, a password reset link will be sent."}

@app.post("/reset-password/")
def reset_password(reset_data: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    Completes the password reset process by verifying the token and updating the password.
    """
    # Check if user exists
    user = db.query(models.User).filter(models.User.email == reset_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset request"
        )
    
    # Verify the reset token
    if not verify_password_reset_token(reset_data.token, reset_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    # Update the password
    user.hashed_password = get_password_hash(reset_data.new_password)
    db.commit()
    
    return {"message": "Password has been reset successfully"}

# Get all users (admin only)
@app.get("/users/all", response_model=List[schemas.User])
def get_all_users(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if user is superuser
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view all users"
        )
    
    # Get all users
    users = db.query(models.User).all()
    print(f"Returning {len(users)} users")
    # For debugging - print first user details
    if users:
        print(f"First user: id={users[0].id}, email={users[0].email}, is_superuser={users[0].is_superuser}")
    return users