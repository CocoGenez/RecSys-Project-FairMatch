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
