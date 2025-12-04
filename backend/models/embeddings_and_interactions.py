import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer, util
import torch
from pathlib import Path

project_root = Path(__file__).parent

# 1. Load clean data
students = pd.read_parquet(project_root / "students.parquet")
jobs = pd.read_parquet(project_root / "jobs.parquet")

# 2. LARGE SAMPLE: take 20,000 jobs to maintain diversity
sample_size = min(20000, len(jobs))
jobs_sample = jobs.sample(n=sample_size, random_state=42).reset_index(drop=True)

print("Students:", students.shape)
print("Jobs sample (before text):", jobs_sample.shape)

# 3. Build job text for embeddings
def build_job_text(row):
    return (
        f"title {row.get('job title', '')}. "
        f"role {row.get('role', '')}. "
        f"skills {row.get('skills', '')}. "
        f"description {row.get('job description', '')}. "
        f"responsibilities {row.get('responsibilities', '')}. "
        f"about company {row.get('company profile', '')}. " 
    )

jobs_sample["JobText"] = jobs_sample.apply(build_job_text, axis=1)

print("Jobs sample (avec JobText):", jobs_sample.shape)

# 4. Encode with SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")

user_emb = model.encode(
    students["ProfileText"].tolist(),
    convert_to_tensor=True,
    show_progress_bar=True,
)

job_emb = model.encode(
    jobs_sample["JobText"].tolist(),
    convert_to_tensor=True,
    show_progress_bar=True,
)

# 5. Build positive/negative interactions
user_ids = students.index.to_list()
job_ids = jobs_sample.index.to_list()

interactions = []

# Positives: top-10 jobs by similarity
for i, uvec in enumerate(user_emb):
    sims = util.cos_sim(uvec, job_emb)[0]
    topk = torch.topk(sims, k=10)
    top_job_idx = topk.indices.cpu().numpy()

    uid = user_ids[i]
    for j_idx in top_job_idx:
        jid = job_ids[int(j_idx)]
        interactions.append({"UserId": int(uid), "JobId": int(jid), "Label": 1})

# Negatives: 10 random jobs per user
for uid in user_ids:
    negative_choices = np.random.choice(job_ids, size=10, replace=False)
    for jid in negative_choices:
        interactions.append({"UserId": int(uid), "JobId": int(jid), "Label": 0})

inter_df = pd.DataFrame(interactions)

# 6. Shuffle + split train/val/test
inter_df = inter_df.sample(frac=1, random_state=42).reset_index(drop=True)

n = len(inter_df)
train_end = int(0.70 * n)
val_end = int(0.85 * n)

splits = (
    ["train"] * train_end +
    ["val"] * (val_end - train_end) +
    ["test"] * (n - val_end)
)

inter_df["Split"] = splits

print(inter_df["Split"].value_counts(normalize=True))

# 7. Save artifacts
inter_df.to_parquet(project_root / "interactions.parquet", index=False)
jobs_sample.to_parquet(project_root / "jobs_sample.parquet", index=False)

torch.save(user_emb, project_root / "user_embeddings.pt")
torch.save(job_emb, project_root / "job_embeddings.pt")

print("Saved interactions.parquet, jobs_sample.parquet, user_embeddings.pt, job_embeddings.pt")
