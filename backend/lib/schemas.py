from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    role: str

class UserLogin(UserBase):
    password: str

class User(UserBase):
    id: int
    role: Optional[str] = None
    name: Optional[str] = None
    
    class Config:
        orm_mode = True
