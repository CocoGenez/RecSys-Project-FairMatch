
import pandas as pd
import torch
from pathlib import Path

processed_dir = Path("c:/Code/RecSys-Project-FairMatch/backend/Processed")

try:
    jobs = pd.read_parquet(processed_dir / "jobs.parquet")
    print(f"jobs.parquet rows: {len(jobs)}")
except Exception as e:
    print(f"Error reading jobs.parquet: {e}")

try:
    jobs_sample = pd.read_parquet(processed_dir / "jobs_sample.parquet")
    print(f"jobs_sample.parquet rows: {len(jobs_sample)}")
except Exception as e:
    print(f"Error reading jobs_sample.parquet: {e}")

try:
    emb = torch.load(processed_dir / "job_embeddings.pt")
    print(f"job_embeddings.pt shape: {emb.shape}")
except Exception as e:
    print(f"Error reading job_embeddings.pt: {e}")
