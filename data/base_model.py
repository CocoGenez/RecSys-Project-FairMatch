import torch
import pandas as pd
from sentence_transformers import util
from pathlib import Path

root = Path(__file__).parent

# Charger les artefacts déjà calculés
user_emb = torch.load(root / "user_embeddings.pt")      # (180, 384)
job_emb  = torch.load(root / "job_embeddings.pt")       # (N_jobs, 384)
jobs     = pd.read_parquet(root / "jobs_sample.parquet")
students = pd.read_parquet(root / "students.parquet")

print("user_emb shape:", user_emb.shape)
print("job_emb shape :", job_emb.shape)
print("jobs shape    :", jobs.shape)


def recommend_for_user(user_id: int, top_k: int = 5) -> pd.DataFrame:
    """
    Modèle de base : top-k jobs les plus similaires (cosine)
    On affiche aussi le job id et le nom de l'entreprise.
    """
    # 1) embedding de l'utilisateur
    u = user_emb[user_id].unsqueeze(0)   # (1, 384)

    # 2) scores de similarité cosinus
    scores = util.cos_sim(u, job_emb)[0]  # (N_jobs,)

    # 3) top-k indices
    top_idx = torch.topk(scores, k=top_k).indices.cpu().tolist()

    # 4) colonnes à afficher (on ne garde que celles qui existent vraiment)
    cols = []
    for c in ["job id", "job title", "role", "skills", "company", "companybucket"]:
        if c in jobs.columns:
            cols.append(c)

    recos = jobs.iloc[top_idx][cols]

    print(f"[DEBUG] user_id={user_id}, indices jobs={top_idx}")
    return recos


if __name__ == "__main__":
    for uid in [0, 50, 100]:
        print("\n===== USER", uid, "=====")
        print(recommend_for_user(uid, top_k=5))

