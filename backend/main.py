from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import schemas

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency for getting DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 1️⃣ Create a Business
@app.post("/businesses/")
def create_business(business: schemas.BusinessCreate, db: Session = Depends(get_db)):
    new_business = models.Business(name=business.name)
    db.add(new_business)
    db.commit()
    db.refresh(new_business)
    return new_business

# 2️⃣ Create a Redeemr Reward
@app.post("/rewards/")
def create_reward(reward: schemas.RewardCreate, db: Session = Depends(get_db)):
    business = db.query(models.Business).filter(models.Business.id == reward.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    new_reward = models.RedeemrReward(name=reward.name, points_required=reward.points_required, business_id=reward.business_id)
    db.add(new_reward)
    db.commit()
    db.refresh(new_reward)
    return new_reward

# 3️⃣ List Businesses
@app.get("/businesses/")
def get_businesses(db: Session = Depends(get_db)):
    return db.query(models.Business).all()

# 4️⃣ List Rewards for a Business
@app.get("/businesses/{business_id}/rewards/")
def get_rewards(business_id: int, db: Session = Depends(get_db)):
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    return db.query(models.RedeemrReward).filter(models.RedeemrReward.business_id == business_id).all()

# 5️⃣ Register a User
@app.post("/users/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    new_user = models.User(name=user.name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# 6️⃣ Redeem a Reward
@app.post("/redeem/")
def redeem_reward(redeem_request: schemas.RedeemRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == redeem_request.user_id).first()
    reward = db.query(models.RedeemrReward).filter(models.RedeemrReward.id == redeem_request.reward_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    transaction = models.Transaction(user_id=redeem_request.user_id, reward_id=redeem_request.reward_id)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {"message": "Reward redeemed!", "transaction": transaction}
