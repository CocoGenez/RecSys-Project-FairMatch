
import pandas as pd
import torch
from pathlib import Path

processed_dir = Path("c:/Code/RecSys-Project-FairMatch/backend/Processed")

def verify_alignment():
    print("Verifying data alignment...")
    try:
        jobs_sample = pd.read_parquet(processed_dir / "jobs_sample.parquet")
        print(f"jobs_sample.parquet rows: {len(jobs_sample)}")
        
        emb = torch.load(processed_dir / "job_embeddings.pt")
        print(f"job_embeddings.pt shape: {emb.shape}")
        
        if len(jobs_sample) == emb.shape[0]:
            print("SUCCESS: Row counts match!")
        else:
            print(f"FAILURE: Mismatch! {len(jobs_sample)} vs {emb.shape[0]}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_alignment()
