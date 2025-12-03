from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from lib import database, models, schemas

router = APIRouter()

@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user_create: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_create.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    
    # Create new user
    # In a real app, you should hash the password
    print(f"[DEBUG] Creating user: email={user_create.email}, role={user_create.role}")
    new_user = models.User(
        email=user_create.email,
        password=user_create.password, # Hashing is recommended!
        role=user_create.role,
        name=user_create.email.split('@')[0] # Default name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print(f"[DEBUG] User created: id={new_user.id}, email={new_user.email}")
    return new_user

@router.post("/login", response_model=schemas.User)
def login_user(user_credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # In a real app, you should verify the hashed password
    if user.password != user_credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
        )
    return user

@router.get("/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
