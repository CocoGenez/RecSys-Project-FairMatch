from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    email: str
    role: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(UserBase):
    id: int
    name: Optional[str] = None

    class Config:
        orm_mode = True
