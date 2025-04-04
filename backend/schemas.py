from pydantic import BaseModel

class BusinessCreate(BaseModel):
    name: str

class RewardCreate(BaseModel):
    name: str
    points_required: int
    business_id: int

class UserCreate(BaseModel):
    name: str

class RedeemRequest(BaseModel):
    user_id: int
    reward_id: int
