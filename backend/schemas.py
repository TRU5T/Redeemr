from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class BusinessCreate(BaseModel):
    name: str

class BusinessRegister(BaseModel):
    name: str

class BusinessResponse(BaseModel):
    id: int
    name: str
    owner_id: Optional[int] = None
    is_approved: bool = False
    
    class Config:
        from_attributes = True

class RewardCreate(BaseModel):
    name: str
    points_required: int
    business_id: int

class UserBase(BaseModel):
    email: EmailStr
    name: str
    is_business_owner: bool = False

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class User(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    email: EmailStr
    new_password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class RedeemRequest(BaseModel):
    user_id: int
    reward_id: int
