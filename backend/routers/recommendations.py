from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from lib.database import get_db
from lib.models import User, Interaction
from models.base_model import recommend_from_text
from models.fairness_reranker import rerank_conditional_demographic_parity

router = APIRouter()

@router.get("/recommend/{user_id}")
def recommend(user_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns job recommendations for the given user_id using the trained content-based model.
    """
    # 1. Fetch User from DB
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Construct Profile Text (similar to training pipeline)
    # "gender {Gender}, age {AgeBucket}, major {Major}, interested domain {InterestedDomain}, projects {Projects}, skills python {PythonSkill}, sql {SqlSkill}, java {JavaSkill}."
    
    # Helper for age bucket
    age_bucket = "under35"
    if user.age and user.age >= 35:
        age_bucket = "35plus"
    
    # Helper for projects list
    projects_str = ""
    if user.projects:
        if isinstance(user.projects, list):
            projects_str = " ".join(user.projects)
        else:
            projects_str = str(user.projects)

    profile_text = (
        f"gender {user.gender or 'Unknown'}, "
        f"age {age_bucket}, "
        f"interested domain {user.interested_domain or 'Unknown'}, "
        f"projects {projects_str}, "
        f"skills python {user.python_level or 'Weak'}, "
        f"sql {user.sql_level or 'Weak'}, "
        f"java {user.java_level or 'Weak'}."
    )
    
    print(f"[INFO] Generating recommendations for User {user_id} with profile: {profile_text[:100]}...")

    # 2.5 Get Seen Jobs (Likes and Passes)
    interactions = db.query(Interaction).filter(
        Interaction.user_id == user_id,
        Interaction.type == "job"
    ).all()
    seen_ids = [i.item_id for i in interactions]
    
    print(f"[INFO] User {user_id} has seen {len(seen_ids)} jobs. Excluding them.")

    # 3. Get Recommendations from Model
    # Check if we have a stored embedding (from online learning)
    # Fetch larger pool for reranking
    fetch_k = 50 
    final_k = 10
    
    # Use low hybrid weight to prioritize content-based relevance
    HYBRID_WEIGHT = 0

    if user.profile_embedding:
        import torch
        from models.base_model import recommend_from_embedding
        print(f"[INFO] Using stored profile embedding for User {user_id}")
        u_emb = torch.tensor(user.profile_embedding)
        candidates = recommend_from_embedding(u_emb, top_k=fetch_k, exclude_ids=seen_ids, hybrid_weight=HYBRID_WEIGHT)
    else:
        # Fallback to text-based
        candidates, u_emb = recommend_from_text(profile_text, top_k=fetch_k, exclude_ids=seen_ids, hybrid_weight=HYBRID_WEIGHT)
        
        # Save this initial embedding to DB so we can update it later!
        if u_emb is not None:
            try:
                user.profile_embedding = u_emb.tolist()
                db.commit()
                print(f"[INFO] Initial profile embedding saved for User {user_id}")
            except Exception as e:
                print(f"[WARN] Could not save initial embedding: {e}")
    
    print(f"[INFO] Retrieved {len(candidates)} candidates. Applying Fairness Reranker...")

    # 4. Compute Exposure Counts for Fairness
    # We need to know how many times each job has been shown (or interacted with).
    # Ideally, we count 'impressions', but here we might only have interactions.
    # Let's assume 'interactions' table tracks exposure if we had an 'impression' type,
    # but currently it has 'like'/'pass'. We can use that as a proxy for exposure count.
    
    # Get exposure counts for these candidates
    candidate_ids = [c["job_id"] for c in candidates]
    
    # Query DB for counts
    # SELECT item_id, COUNT(*) FROM interactions WHERE item_id IN candidate_ids GROUP BY item_id
    exposure_counts = db.query(Interaction.item_id, func.count(Interaction.id))\
        .filter(Interaction.item_id.in_(candidate_ids))\
        .group_by(Interaction.item_id).all()
    
    exposure_map = {item_id: count for item_id, count in exposure_counts}
    
    # Inject exposure count and 'qualified' (dummy for now) into candidates
    for c in candidates:
        c["exposure_count"] = exposure_map.get(c["job_id"], 0)
        c["qualified"] = True # Assume all retrieved are qualified enough
        # Ensure protected attribute exists
        if "company_bucket" not in c:
            c["company_bucket"] = "unknown"

    # 5. Apply Reranking
    reranked_jobs = rerank_conditional_demographic_parity(
        candidates,
        k=final_k,
        protected_attr="company_bucket",
        coverage_weight=5.0 # Boost unseen jobs
    )
    
    print(f"[INFO] Reranking complete. Returning top {len(reranked_jobs)} jobs.")

    response = {
        "user_id": user_id,
        "num_recommendations": len(reranked_jobs),
        "recommendations": reranked_jobs,
        "note": "Generated by Content-Based Model + Fairness Reranker",
    }
    return response
