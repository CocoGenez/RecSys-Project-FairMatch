import duckdb
import pandas as pd
import torch
from pathlib import Path
from typing import Dict, List, Any

DATA_DIR = Path(__file__).parent.parent / "data/Processed"

class DataLoader:
    def __init__(self):
        self.jobs_df = None
        self.students_df = None
        self.interactions_df = None
        self.job_embeddings = None
        self.user_embeddings = None
        self._load_all()
    
    def _load_parquet_safe(self, path):
        """Lit un fichier parquet même s'il est corrompu"""
        try:
            return pd.read_parquet(path)
        except Exception:
            print(f"⚠️ PyArrow a échoué, utilisation de DuckDB pour : {path}")
            return duckdb.query(f"SELECT * FROM read_parquet('{path}')").to_df()

    def _load_all(self):
        try:
            if (DATA_DIR / "jobs.parquet").exists():
                self.jobs_df = self._load_parquet_safe(DATA_DIR / "jobs.parquet")
            elif (DATA_DIR / "jobs_sample.parquet").exists():
                self.jobs_df = self._load_parquet_safe(DATA_DIR / "jobs_sample.parquet")

            if (DATA_DIR / "students.parquet").exists():
                self.students_df = self._load_parquet_safe(DATA_DIR / "students.parquet")

            if (DATA_DIR / "interactions.parquet").exists():
                self.interactions_df = self._load_parquet_safe(DATA_DIR / "interactions.parquet")

            # Embeddings
            if (DATA_DIR / "job_embeddings.pt").exists():
                self.job_embeddings = torch.load(DATA_DIR / "job_embeddings.pt", map_location='cpu')

            if (DATA_DIR / "user_embeddings.pt").exists():
                self.user_embeddings = torch.load(DATA_DIR / "user_embeddings.pt", map_location='cpu')

            print(f"✅ Données chargées: "
                  f"{len(self.jobs_df) if self.jobs_df is not None else 0} jobs, "
                  f"{len(self.students_df) if self.students_df is not None else 0} étudiants, "
                  f"{len(self.interactions_df) if self.interactions_df is not None else 0} interactions")
        
        except Exception as e:
            print(f"❌ Erreur lors du chargement des données: {e}")


data_loader = DataLoader()
