from pydantic import BaseModel
from typing import Optional, List

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
    gender: Optional[str] = None
    interested_domain: Optional[str] = None
    age: Optional[int] = None
    projects: Optional[List[str]] = None
    future_career: Optional[str] = None
    python_level: Optional[str] = None
    sql_level: Optional[str] = None
    java_level: Optional[str] = None
    
    class Config:
        orm_mode = True
