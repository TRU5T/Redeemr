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
    ACCESS_TOKEN_EXPIRE_MINUTES
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
        is_superuser=False
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

# 1️⃣ Create a Business
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
def get_businesses(db: Session = Depends(get_db)):
    return db.query(models.Business).all()

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