from sqlalchemy import Column, Integer, String, JSON
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    
    # Authentication fields
    email = Column(String, unique=True, index=True, nullable=True)
    password = Column(String, nullable=True)
    role = Column(String, nullable=True)  # 'recruiter' or 'jobseeker'
    
    # Manual Inputs
    name = Column(String, index=True, nullable=True)
    gender = Column(String, nullable=True)  # Protected attribute for Fairness
    interested_domain = Column(String, nullable=True)
    
    # Parsed from Resume
    age = Column(Integer)
    projects = Column(JSON)  # Stores the list ['Project A', 'Project B']
    future_career = Column(String) # Target variable for your ML model
    
    # Skills Levels (Strong, Average, Weak)
    python_level = Column(String)
    sql_level = Column(String)
    java_level = Column(String)

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    item_id = Column(String) # Job ID or Candidate ID
    type = Column(String) # "job" or "candidate"
    action = Column(String) # "like" or "pass"
    timestamp = Column(String) # ISO format string for simplicity