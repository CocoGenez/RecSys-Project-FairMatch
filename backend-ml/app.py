from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from routers import recommendations

app = FastAPI(
    title="FairMatch ML Service",
    description="Recommendations service with ML",
    version="1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations.router)

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "FairMatch ML Service",
        "version": "1.0",
    }
