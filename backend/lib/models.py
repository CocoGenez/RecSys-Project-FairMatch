from sqlalchemy import Column, Integer, String, JSON, Text
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    
    # Manual Inputs
    name = Column(String, index=True)
    gender = Column(String)  # Protected attribute for Fairness
    interested_domain = Column(String)
    
    # Informations personnelles du CV
    surname = Column(String)  # Nom de famille
    email = Column(String, unique=True, index=True)  # Email unique pour identifier l'utilisateur
    phone = Column(String)
    address = Column(String)
    description = Column(Text)  # Description/résumé professionnel
    
    # Informations de base
    age = Column(Integer)
    
    # Projets et carrière
    projects = Column(JSON)  # Stores the list ['Project A', 'Project B']
    future_career = Column(String) # Target variable for your ML model
    
    # Compétences techniques
    hard_skills = Column(JSON)  # ['Python', 'SQL', 'Docker', 'AWS']
    python_level = Column(String)  # Strong, Average, Weak
    sql_level = Column(String)
    java_level = Column(String)
    
    # Compétences comportementales
    soft_skills = Column(JSON)  # ['Leadership', 'Communication']
    
    # Langues
    languages = Column(JSON)  # ['Français: Natif', 'Anglais: B2']
    
    # Formation et expérience
    education = Column(JSON)  # Liste des formations
    work_experience = Column(JSON)  # Liste des expériences professionnelles
    
    # Certifications et intérêts
    certifications = Column(JSON)  # Liste des certifications
    interests = Column(JSON)  # Liste des hobbies/intérêts