from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from lib.database import get_db
from lib.models import Interaction


router = APIRouter()

class InteractionCreate(BaseModel):
    user_id: int
    item_id: str
    type: str
    action: str
    timestamp: str

@router.post("/api/interactions")
def create_interaction(interaction: InteractionCreate, db: Session = Depends(get_db)):
    db_interaction = Interaction(
        user_id=interaction.user_id,
        item_id=interaction.item_id,
        type=interaction.type,
        action=interaction.action,
        timestamp=interaction.timestamp
    )
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return {"status": "success", "id": db_interaction.id}

@router.get("/api/interactions/{user_id}")
def get_user_interactions(user_id: int, db: Session = Depends(get_db)):
    """
    Get all interactions for a user (both likes and passes).
    Returns: { "liked": ["job1", "job2"], "passed": ["job3", "job4"] }
    """
    interactions = db.query(Interaction).filter(
        Interaction.user_id == user_id,
        Interaction.type == "job"
    ).all()
    
    liked = [i.item_id for i in interactions if i.action == "like"]
    passed = [i.item_id for i in interactions if i.action == "pass"]
    
    return {
        "liked": liked,
        "passed": passed
    }

@router.get("/api/liked-jobs/{user_id}")
def get_liked_jobs(user_id: int, db: Session = Depends(get_db)):
    # 1. Get liked job IDs from interactions
    interactions = db.query(Interaction).filter(
        Interaction.user_id == user_id,
        Interaction.type == "job",
        Interaction.action == "like"
    ).all()
    
    if not interactions:
        return []
        
    liked_ids = [i.item_id for i in interactions]
    
    # 2. Fetch job details from the dataframe (via base_model)
    from models.base_model import get_job_details
    jobs = get_job_details(liked_ids)
    
    return jobs
