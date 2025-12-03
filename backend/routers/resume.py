from fastapi import APIRouter, UploadFile, Form, File, HTTPException, Depends
from sqlalchemy.orm import Session
import fitz  # PyMuPDF
from lib.gemini_parser import parse_resume_with_gemini
from lib.database import get_db
from lib.models import User


router = APIRouter()

@router.post("/api/parse-resume")
async def parse_resume(
    file: UploadFile = File(...),
    user_id: int = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    interested_domain: str = Form(...),
    db: Session = Depends(get_db)  # Inject Database Session
):
    # 1. Validate File
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # 2. Extract Text
    try:
        pdf_bytes = await file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = "".join([page.get_text() for page in doc])
    except Exception:
        raise HTTPException(status_code=500, detail="Could not read PDF")

    # 3. AI Parsing
    parsed_data = parse_resume_with_gemini(text, interested_domain)
    
    print(f"[INFO] Resume parsed for user '{name}': {parsed_data}")

    
    if not parsed_data:
        raise HTTPException(status_code=500, detail="AI parsing failed")

    # 4. Update Existing User in PostgreSQL
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update fields
    user.name = name
    user.gender = gender
    user.interested_domain = interested_domain
    user.age = parsed_data.get("Age")
    user.projects = parsed_data.get("Projects")
    user.future_career = parsed_data.get("Future_Career")
    user.python_level = parsed_data.get("Python_Level")
    user.sql_level = parsed_data.get("SQL_Level")
    user.java_level = parsed_data.get("Java_Level")
    
    db.commit()
    db.refresh(user)
    
    # 5. Return the saved profile (with ID)
    return {
        "status": "success",
        "user_id": user.id,
        "data": parsed_data
    }
