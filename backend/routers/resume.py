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

    # 4. Save to PostgreSQL
    new_user = User(
        name=name,
        gender=gender,
        interested_domain=interested_domain,
        age=parsed_data.get("Age"),
        projects=parsed_data.get("Projects"),
        future_career=parsed_data.get("Future_Career"),
        python_level=parsed_data.get("Python_Level"),
        sql_level=parsed_data.get("SQL_Level"),
        java_level=parsed_data.get("Java_Level")
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # Get the generated ID
    
    # 5. Return the saved profile (with ID)
    return {
        "status": "success",
        "user_id": new_user.id,
        "data": parsed_data
    }
