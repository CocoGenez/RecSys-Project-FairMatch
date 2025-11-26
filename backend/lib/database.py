from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# run this line for docker desktop
# docker run --name fairmatch-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
# Format: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
# Example: postgresql://postgres:password@localhost:5432/fairmatch
# either you use the .env variable or default to local postgres
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:password@localhost:5432/postgres")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session in endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()