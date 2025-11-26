from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from lib.database import engine, Base

# Import routers
from routers import recommendations, resume, interactions

# Create tables automatically (for dev/POC)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FairMatch API",
    description="Backend API",
    version="0.02",
)

app.add_middleware(
    CORSMiddleware,
    # In production, replace "*" with your actual Vercel URL
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(recommendations.router)
app.include_router(resume.router)
app.include_router(interactions.router)

# -------------------------
# Root endpoint (healthcheck)
# -------------------------
@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "FairMatch API is running",
        "version": "1.0",
    }