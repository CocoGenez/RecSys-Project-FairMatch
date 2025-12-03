import torch
import pandas as pd
from sentence_transformers import SentenceTransformer, util
from pathlib import Path

root = Path(__file__).parent
processed_dir = root.parent / "Processed"

# Charger les artefacts déjà calculés
# On utilise try/except pour éviter que ça plante si les fichiers n'existent pas encore (dev mode)
try:
    # user_emb = torch.load(processed_dir / "user_embeddings.pt")      # (180, 384) - Pas nécessaire pour les nouveaux users
    job_emb  = torch.load(processed_dir / "job_embeddings.pt")       # (N_jobs, 384)
    jobs     = pd.read_parquet(processed_dir / "jobs_sample.parquet")

    print("Models loaded successfully.")
    print("job_emb shape :", job_emb.shape)
    print("jobs shape    :", jobs.shape)
    print("jobs columns  :", jobs.columns.tolist())
except Exception as e:
    print(f"WARNING: Could not load model artifacts: {e}")
    job_emb = None
    jobs = None

# Charger le modèle de sentence embedding pour les nouveaux users
try:
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("SentenceTransformer loaded.")
except Exception as e:
    print(f"WARNING: Could not load SentenceTransformer: {e}")
    model = None


def recommend_from_text(profile_text: str, top_k: int = 5) -> list:
    """
    Génère des recommandations pour un texte de profil donné (Cold Start).
    """
    if model is None or job_emb is None or jobs is None:
        print("Error: Model or data not loaded.")
        return []

    # 1) Encoder le texte du profil
    # convert_to_tensor=True renvoie un tensor sur CPU ou GPU selon dispo
    u_emb = model.encode(profile_text, convert_to_tensor=True) # (384,)

    # 2) Scores de similarité cosinus
    # util.cos_sim attend (N, D) et (M, D) -> renvoie (N, M)
    scores = util.cos_sim(u_emb.unsqueeze(0), job_emb)[0]  # (N_jobs,)

    # 3) Top-k indices
    top_idx = torch.topk(scores, k=top_k).indices.cpu().tolist()

    # 4) Récupérer les jobs
    cols = []
    for c in ["jobid", "job title", "role", "skills", "company", "companybucket", "location", "salary_range", "job description"]:
        if c in jobs.columns:
            cols.append(c)
    
    # Fallback si colonnes manquantes (pour compatibilité frontend)
    recos_df = jobs.iloc[top_idx].copy()
    
    # Convertir en liste de dicts pour l'API
    results = []
    # Debug: print columns to see what we have
    # print(f"[DEBUG] Columns: {jobs.columns.tolist()}")
    
    for idx, row in recos_df.iterrows():
        # Ensure unique ID: use 'jobid' column if valid, else use the dataframe index
        raw_id = row.get("jobid")
        if raw_id and str(raw_id).strip() != "" and str(raw_id).lower() != "nan":
            final_id = str(raw_id)
        else:
            final_id = str(idx)

        job_dict = {
            "job_id": final_id, # Frontend attend string
            "title": row.get("job title", "Unknown Title"),
            "company": row.get("company", "Unknown Company"),
            "location": row.get("location", "Remote"), # Default
            "skills": row.get("skills", "").split(",") if isinstance(row.get("skills"), str) else [],
            "salary_range": row.get("salary_range", "Competitive"),
            "description": row.get("job description", "")
        }
        results.append(job_dict)

    print(f"[DEBUG] Recommended {len(results)} jobs for profile text length {len(profile_text)}")
    for i, job in enumerate(results[:10]):
        print(f"  {i+1}. {job['title']} at {job['company']}")
    return results


if __name__ == "__main__":
    test_text = "python developer machine learning sql data science"
    print(recommend_from_text(test_text))

