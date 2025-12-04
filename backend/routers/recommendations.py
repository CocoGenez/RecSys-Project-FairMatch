from typing import Dict, Any, List, Optional
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from lib.database import get_db
# Ensure Interaction is imported, as it is used for logging exposure
from lib.models import User, Interaction 
from models.base_model import recommend_from_text
from models.fairness_reranker import rerank_conditional_demographic_parity

router = APIRouter()


# -----------------------------
# Helper functions
# -----------------------------
def _infer_sensitive_key(items: List[dict]) -> Optional[str]:
    """
    Try to guess which key in the recommendation items could be used
    as a 'sensitive attribute' (gender, group, etc.).
    Adapt this to your real data if needed.
    """
    if not items:
        return None

    candidate_keys = [
        "group",
        "gender",
        "candidate_gender",
        "sensitive_attribute",
        "sensitive_attr",
        "demographic_group",
        "companybucket",
        "company",
        "location",
    ]
    for key in candidate_keys:
        if key in items[0]:
            return key
    return None


def _log_distribution(items: List[dict], label: str) -> Optional[str]:
    """
    Print group distribution for debugging / demo purposes.
    """
    if not items:
        print(f"[FAIRNESS] {label}: no items, cannot compute distribution.")
        return None

    sensitive_key = _infer_sensitive_key(items)
    if not sensitive_key:
        sample_keys = list(items[0].keys())
        print(
            f"[FAIRNESS] {label}: no obvious sensitive attribute key found in items "
            f"(looked for group / gender / company / location / companybucket). "
            f"Available keys on first item: {sample_keys}"
        )
        return None

    counts = Counter([item.get(sensitive_key, "unknown") for item in items])
    total = len(items)
    dist_str = ", ".join(
        [f"{group}={count} ({count/total:.1%})" for group, count in counts.items()]
    )

    print(
        f"[FAIRNESS] {label}: total={total}, key='{sensitive_key}', "
        f"distribution -> {dist_str}"
    )

    return sensitive_key


def _get_exposure_counts(db: Session, job_ids: List[str]) -> Dict[str, int]:
    """
    Returns {job_id_str -> exposure_count} based on the interactions table.

    Exposure = number of interactions where:
        - type == 'job'
        - item_id in job_ids
        - action in ('like', 'pass', 'shown')
    """
    if not job_ids:
        return {}

    rows = (
        db.query(
            Interaction.item_id,
            func.count(Interaction.id).label("cnt"),
        )
        .filter(
            Interaction.type == "job",
            Interaction.item_id.in_(job_ids),
            # CRITICAL FIX: Include 'shown' actions to count prior exposures
            Interaction.action.in_(["like", "pass", "shown"]), 
        )
        .group_by(Interaction.item_id)
        .all()
    )

    exposure_counts: Dict[str, int] = {
        str(item_id): int(cnt) for item_id, cnt in rows
    }
    return exposure_counts


# -----------------------------
# Main endpoint
# -----------------------------
@router.get("/recommend/{user_id}")
def recommend(user_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns job recommendations for the given user_id using the trained
    content-based model, then applies a fairness-aware reranking
    (Conditional Demographic Parity) with exposure-based coverage.
    """
    # 1. Fetch User from DB
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Construct Profile Text (similar to training pipeline)
    age_bucket = "under35"
    if user.age and user.age >= 35:
        age_bucket = "35plus"

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

    print(
        f"[INFO] Generating recommendations for User {user_id} "
        f"with profile: {profile_text[:120]}..."
    )

    # 3. Get Recommendations from Model (baseline ranking)
    raw_jobs: List[dict] = recommend_from_text(profile_text, top_k=100)
    print(
        f"[INFO] Generated {len(raw_jobs)} baseline recommendations "
        f"for User {user_id}"
    )

    # 3a. Load exposure counts from interactions table
    job_ids: List[str] = []
    for job in raw_jobs:
        jid = job.get("job_id") or job.get("id")
        if jid is not None:
            job_ids.append(str(jid))

    exposure_counts = _get_exposure_counts(db, job_ids)
    print(f"[COVERAGE] Found exposure_count for {len(exposure_counts)} jobs.")

    # 3b. Enrich items with 'score', 'group', 'qualified', 'exposure_count'
    enriched_jobs: List[dict] = []
    n = len(raw_jobs)

    for idx, job in enumerate(raw_jobs):
        item = dict(job)  # shallow copy

        # Higher score = higher original relevance
        item["score"] = float(n - idx)

        # Use company as proxy fairness group
        item["group"] = job.get("company", "unknown")

        # Mark as qualified (required by CDP)
        item["qualified"] = True

        # Coverage info from interactions table
        jid = job.get("job_id") or job.get("id")
        jid_str = str(jid) if jid is not None else None
        exposure = 0
        if jid_str is not None:
            # Use exposure_counts loaded from DB
            exposure = exposure_counts.get(jid_str, 0)

        item["job_id"] = jid_str
        item["exposure_count"] = exposure

        enriched_jobs.append(item)

    # 3c. Log baseline distribution
    baseline_key: Optional[str] = _log_distribution(
        enriched_jobs, "Before reranking (baseline)"
    )

    # 4. Apply Fairness Reranker (CDP) with safe fallback
    TOP_K = 20

    try:
        # The reranker will use the 'exposure_count' to adjust the effective score
        fair_shortlist: List[dict] = rerank_conditional_demographic_parity(
            enriched_jobs,
            TOP_K,
            protected_attr="group",
        )
        print(
            f"[FAIRNESS] Reranker (CDP) applied successfully "
            f"for User {user_id} on {len(fair_shortlist)} items."
        )
    except Exception as e:
        print(
            f"[FAIRNESS] ERROR while applying reranker for User {user_id}: {e}. "
            f"Falling back to baseline ranking."
        )
        # Fallback to the top K items by original relevance if reranking fails
        fair_shortlist = enriched_jobs[:TOP_K] 

    # 5. Log post-reranking distribution
    reranked_key: Optional[str] = _log_distribution(
        fair_shortlist, "After reranking (CDP)"
    )
    
    # 5b. Log New Exposures to DB (CRITICAL FEEDBACK LOOP)
    # Log the items shown in the fair_shortlist so they count as exposure 
    # for the next request.
    new_interactions = []
    for item in fair_shortlist:
        job_id = item.get("job_id")
        if job_id and user_id:
            new_interactions.append(
                Interaction(
                    user_id=user_id,
                    item_id=job_id,
                    type="job",
                    action="shown", # Log the action as 'shown'
                )
            )

    if new_interactions:
        db.add_all(new_interactions)
        db.commit()
        print(f"[COVERAGE] Logged {len(new_interactions)} new 'shown' interactions for User {user_id}")


    # 6. Build response
    response = {
        "user_id": user_id,
        "num_recommendations": len(fair_shortlist),
        "recommendations": fair_shortlist,
        "note": (
            "Generated by Content-Based Model + Fairness Reranker (CDP) "
            f"with exposure-aware coverage. Sensitive key baseline="
            f"{baseline_key}, after_rerank={reranked_key}"
        ),
    }
    return response