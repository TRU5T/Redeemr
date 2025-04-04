from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel  # <-- Add Pydantic import
from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# ✅ Allow CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to ["http://localhost:3000"] if preferred
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency for getting DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 1️⃣ Create a Business
@app.post("/businesses/")
def create_business(name: str, db: Session = Depends(get_db)):
    business = models.Business(name=name)
    db.add(business)
    db.commit()
    db.refresh(business)
    return business

@app.post("/businesses/")
def create_business(business: BusinessCreate, db: Session = Depends(get_db)):
    new_business = models.Business(name=business.name)
    db.add(new_business)
    db.commit()
    db.refresh(new_business)
    return new_business

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