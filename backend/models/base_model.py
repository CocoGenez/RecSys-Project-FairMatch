import torch
import pandas as pd
import re
from sentence_transformers import SentenceTransformer, util
from pathlib import Path

root = Path(__file__).parent
processed_dir = root.parent / "Processed"

class RecSysClassifier(torch.nn.Module):
    def __init__(self, input_dim=768, hidden_dim=128):
        super(RecSysClassifier, self).__init__()
        self.fc1 = torch.nn.Linear(input_dim, hidden_dim)
        self.relu = torch.nn.ReLU()
        self.dropout = torch.nn.Dropout(0.2)
        self.fc2 = torch.nn.Linear(hidden_dim, 64)
        self.fc3 = torch.nn.Linear(64, 1)
        self.sigmoid = torch.nn.Sigmoid()

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.dropout(x)
        x = self.fc2(x)
        x = self.relu(x)
        x = self.fc3(x)
        return self.sigmoid(x)

# Load pre-calculated artifacts
try:
    job_emb  = torch.load(processed_dir / "job_embeddings.pt")       # (N_jobs, 384)
    jobs     = pd.read_parquet(processed_dir / "jobs_sample.parquet")
    
    # Load classifier
    classifier = RecSysClassifier()
    classifier_path = root / "classifier.pt"
    if classifier_path.exists():
        classifier.load_state_dict(torch.load(classifier_path))
        classifier.eval()
        print("Classifier loaded successfully.")
    else:
        print("Warning: classifier.pt not found. Using fallback.")
        classifier = None

    print("Models loaded successfully.")
    if job_emb is not None:
        print("job_emb shape :", job_emb.shape)
    if jobs is not None:
        print("jobs shape    :", jobs.shape)
        print("jobs columns  :", jobs.columns.tolist())
except Exception as e:
    print(f"WARNING: Could not load model artifacts: {e}")
    job_emb = None
    jobs = None
    classifier = None

# Load sentence embedding model
try:
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("SentenceTransformer loaded.")
except Exception as e:
    print(f"WARNING: Could not load SentenceTransformer: {e}")
    model = None


def split_skills(val):
    """
    Robustly split skills string into a list.
    """
    if not isinstance(val, str):
        return []
    val = val.strip()
    if not val:
        return []
        
    skills = []
    current = []
    paren_depth = 0
    s = val
    length = len(s)
    for i, ch in enumerate(s):
        if ch == '(':
            paren_depth += 1
            current.append(ch)
            continue
        if ch == ')':
            paren_depth = max(0, paren_depth - 1)
            current.append(ch)
            continue
        if ch == ',' and paren_depth == 0:
            token = ''.join(current).strip()
            if token:
                skills.append(token)
            current = []
            continue
        if (
            ch == ' ' and paren_depth == 0 and
            i + 1 < length and
            i - 1 >= 0 and
            (s[i - 1].islower() or s[i - 1] == ')') and
            s[i + 1].isupper()
        ):
            token = ''.join(current).strip()
            if token:
                skills.append(token)
            current = []
            continue
        current.append(ch)
    last = ''.join(current).strip()
    if last:
        skills.append(last)
    return [t.strip() for t in skills if t and t.strip()]


def update_user_profile_vector(user_vector, job_id, alpha=0.1):
    """
    Pseudo Online Learning:
    Updates the user vector by moving it slightly towards the vector of the liked job.
    
    Args:
        user_vector (torch.Tensor): Current user embedding (384,)
        job_id (str): ID of the job that was liked
        alpha (float): Learning rate (0.0 to 1.0). How much to adapt.
        
    Returns:
        torch.Tensor: Updated user vector (normalized)
    """
    if job_emb is None or jobs is None:
        return user_vector

    # Find job index
    # Assuming jobs dataframe has 'jobid' column or index matches
    # We need to find the row index in 'jobs' which corresponds to 'job_emb' index
    
    job_idx = -1
    
    # Try to find by column
    if 'job id' in jobs.columns:
        matches = jobs.index[jobs['job id'].astype(str) == str(job_id)].tolist()
        if matches:
            # If index is integer and matches row number
            # But wait, job_emb is aligned with jobs rows.
            # We need the integer position (iloc)
            # If index is not range(N), we need to find the integer location
            
            # Let's assume jobs.index is NOT reliable for position if it was set to jobid
            # We need the integer position of the row where jobid == job_id
            
            # Reset index to be safe? No, that might be expensive.
            # Let's use numpy to find the index
            vals = jobs['job id'].astype(str).values
            indices = (vals == str(job_id)).nonzero()[0]
            if len(indices) > 0:
                job_idx = indices[0]
    
    if job_idx == -1:
        # Fallback: maybe job_id IS the index (if it's an int)
        if str(job_id).isdigit():
            idx = int(job_id)
            if 0 <= idx < len(jobs):
                job_idx = idx
                
    if job_idx == -1 or job_idx >= len(job_emb):
        print(f"Warning: Job ID {job_id} not found for update.")
        return user_vector
        
    target_job_emb = job_emb[job_idx] # (384,)
    
    # Move user vector towards job vector
    # New = (1-alpha) * Old + alpha * Job
    new_vector = (1 - alpha) * user_vector + alpha * target_job_emb
    
    # Normalize to keep it on the hypersphere (cosine similarity relies on direction)
    new_vector = torch.nn.functional.normalize(new_vector, p=2, dim=0)
    
    return new_vector


def recommend_from_embedding(u_emb, top_k=5, exclude_ids=None, hybrid_weight=0.05):
    """
    Generate recommendations from a pre-computed (and potentially updated) user embedding.
    exclude_ids: list of job_ids (str) to exclude from results.
    hybrid_weight: float (0.0 to 1.0). Influence of the classifier. 
                   0.0 = Pure Content-Based (Cosine).
                   1.0 = Pure Classifier (MLP).
    """
    if job_emb is None or jobs is None:
        return []

    # 2) First, calculate Cosine similarity (Content-Based)
    cosine_scores = util.cos_sim(u_emb.unsqueeze(0), job_emb)[0]  # (N_jobs,)
    
    final_scores = cosine_scores

    # 3) Hybrid Scoring with Classifier
    if classifier is not None and hybrid_weight > 0.0:
        try:
            u_emb_expanded = u_emb.unsqueeze(0).expand(job_emb.size(0), -1)
            inputs = torch.cat((u_emb_expanded, job_emb), dim=1)
            
            with torch.no_grad():
                mlp_scores = classifier(inputs).squeeze()
            
            # Hybrid Weight
            alpha = hybrid_weight
            final_scores = (1 - alpha) * cosine_scores + alpha * mlp_scores
            
        except Exception as e:
            print(f"Classifier prediction failed: {e}")
            final_scores = cosine_scores

    # --- EXCLUSION LOGIC ---
    if exclude_ids:
        # We need to find indices of these IDs and set their score to -inf
        # This is a bit slow if exclude_ids is large and we do it naively.
        # Assuming jobs['jobid'] corresponds to the rows.
        
        # Create a mask?
        # Let's map job_id -> index once? No, jobs is global.
        # Let's do a quick lookup.
        # jobs['jobid'] might be strings or ints.
        
        # Optimization: Pre-compute a map if possible, but for now:
        # Filter by boolean mask on dataframe is easy but we need indices for tensor.
        
        # Let's assume exclude_ids is a set of strings
        exclude_set = set(str(x) for x in exclude_ids)
        
        # We need to mask 'final_scores' at specific indices.
        # Iterating over all jobs to check membership is O(N).
        # N is ~20k? It's fine.
        
        # Vectorized approach:
        # jobs['jobid'].isin(exclude_ids) -> boolean mask
        # indices = mask.nonzero()
        
        mask = jobs['job id'].astype(str).isin(exclude_set).values
        # Set scores of masked items to -infinity
        final_scores[torch.tensor(mask, dtype=torch.bool)] = -float('inf')
    # -----------------------

    # 4) Top-k indices
    # We want to return scores too.
    top_k_result = torch.topk(final_scores, k=top_k)
    top_idx = top_k_result.indices.cpu().tolist()
    top_scores = top_k_result.values.cpu().tolist()

    # 5) Retrieve Jobs
    return _get_jobs_from_indices(top_idx, top_scores)


def recommend_from_text(profile_text: str, top_k: int = 5, exclude_ids=None, hybrid_weight=0.05) -> tuple:
    """
    Generates recommendations and returns the initial user embedding.
    Returns: (recommendations_list, user_embedding_tensor)
    """
    if model is None:
        return [], None

    # 1) Encode text
    u_emb = model.encode(profile_text, convert_to_tensor=True) # (384,)
    
    # 2) Recommend
    recos = recommend_from_embedding(u_emb, top_k, exclude_ids=exclude_ids, hybrid_weight=hybrid_weight)
    
    return recos, u_emb


def _get_jobs_from_indices(indices, scores=None):
    results = []
    recos_df = jobs.iloc[indices].copy()
    
    # If scores provided, add them to the dataframe temporarily to iterate easily
    if scores is not None:
        recos_df['__score__'] = scores

    for idx, row in recos_df.iterrows():
        raw_id = row.get("job id")
        final_id = str(raw_id) if raw_id and str(raw_id).lower() != "nan" else str(idx)

        job_dict = {
            "job_id": final_id,
            "title": row.get("job title", "Unknown Title"),
            "role": row.get("role", "Unknown Role"),
            "company": row.get("company", "Unknown Company"),
            "location": row.get("location", "Remote"),
            "country": row.get("country", "Unknown Country"),
            "skills": split_skills(row.get("skills", "")),
            "salary_range": row.get("salary_range", "Competitive"),
            "experience": row.get("experience", "Not specified"),
            "qualifications": row.get("qualifications", "Not specified"),
            "work_type": row.get("work type", "Full-time"),
            "company_bucket": row.get("companybucket", "Unknown"),
            "benefits": row.get("benefits", "Not specified"),
            "company_profile": row.get("company profile", "{}"),
            "description": row.get("job description", ""),
            "score": float(row.get("__score__", 0.0))
        }
        results.append(job_dict)
    return results


def get_job_details(job_ids):
    """
    Retrieve job details for a list of job IDs.
    """
    if jobs is None:
        return []
        
    results = []
    # Convert IDs to string for comparison
    target_ids = set(str(jid) for jid in job_ids)
    
    # Filter dataframe
    # This might be slow if we iterate.
    # Let's use isin
    
    if 'job id' in jobs.columns:
        mask = jobs['job id'].astype(str).isin(target_ids)
        filtered_jobs = jobs[mask]
        
        for idx, row in filtered_jobs.iterrows():
            raw_id = row.get("job id")
            final_id = str(raw_id) if raw_id and str(raw_id).lower() != "nan" else str(idx)
            
            job_dict = {
                "job_id": final_id,
                "title": row.get("job title", "Unknown Title"),
                "role": row.get("role", "Unknown Role"),
                "company": row.get("company", "Unknown Company"),
                "location": row.get("location", "Remote"),
                "country": row.get("country", "Unknown Country"),
                "skills": split_skills(row.get("skills", "")),
                "salary_range": row.get("salary range", "Competitive"),
                "experience": row.get("experience", "Not specified"),
                "qualifications": row.get("qualifications", "Not specified"),
                "work_type": row.get("work type", "Full-time"),
                "company_bucket": row.get("companybucket", "Unknown"),
                "benefits": row.get("benefits", "Not specified"),
                "company_profile": row.get("company profile", "{}"),
                "description": row.get("job description", "")
            }
            results.append(job_dict)
            
    return results


if __name__ == "__main__":
    test_text = "python developer machine learning sql data science"
    print("--- Initial Recommendation ---")
    recos, u_emb = recommend_from_text(test_text, top_k=3)
    for r in recos:
        print(f"{r['title']} ({r['job_id']})")
        
    if len(recos) > 0:
        liked_job_id = recos[0]['job_id']
        print(f"\n--- User LIKES job {liked_job_id} ---")
        print("Updating user profile vector...")
        
        new_u_emb = update_user_profile_vector(u_emb, liked_job_id, alpha=0.2)
        
        print("\n--- New Recommendations (After Update) ---")
        new_recos = recommend_from_embedding(new_u_emb, top_k=3)
        for r in new_recos:
            print(f"{r['title']} ({r['job_id']})")
