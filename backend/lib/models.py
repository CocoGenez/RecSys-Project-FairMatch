from sqlalchemy import Column, Integer, String, JSON
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    
    # Manual Inputs
    name = Column(String, index=True)
    gender = Column(String)  # Protected attribute for Fairness
    interested_domain = Column(String)
    
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