from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Business(Base):
    __tablename__ = "businesses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    rewards = relationship("RedeemrReward", back_populates="business")

class RedeemrReward(Base):
    __tablename__ = "redeemr_rewards"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    name = Column(String, nullable=False)
    points_required = Column(Integer, nullable=False)

    business = relationship("Business", back_populates="rewards")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reward_id = Column(Integer, ForeignKey("redeemr_rewards.id"), nullable=False)
    timestamp = Column(DateTime, server_default=func.now())

    user = relationship("User")
    reward = relationship("RedeemrReward")
