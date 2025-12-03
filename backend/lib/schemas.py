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
    gender: Optional[str] = None
    interested_domain: Optional[str] = None
    age: Optional[int] = None
    projects: Optional[list] = None
    future_career: Optional[str] = None
    python_level: Optional[str] = None
    sql_level: Optional[str] = None
    java_level: Optional[str] = None

    class Config:
        orm_mode = True
