from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Business(Base):
    __tablename__ = "businesses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    
    rewards = relationship("RedeemrReward", back_populates="business")

class RedeemrReward(Base):
    __tablename__ = "redeemr_rewards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    points_required = Column(Integer)
    business_id = Column(Integer, ForeignKey("businesses.id"))

    business = relationship("Business", back_populates="rewards")
    transactions = relationship("Transaction", back_populates="reward")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    transactions = relationship("Transaction", back_populates="user")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    reward_id = Column(Integer, ForeignKey("redeemr_rewards.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="transactions")
    reward = relationship("RedeemrReward", back_populates="transactions")
