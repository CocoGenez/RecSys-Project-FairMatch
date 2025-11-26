import pandas as pd
import duckdb
import torch
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data/Processed"

def load_parquet_safe(path):
    """Lit un fichier parquet même s'il est corrompu"""
    try:
        return pd.read_parquet(path)
    except Exception as e:
        print(f"⚠️ PyArrow a échoué, utilisation de DuckDB pour : {path}")
        print(f"   Erreur: {e}")
        return duckdb.query(f"SELECT * FROM read_parquet('{path}')").to_df()

def inspect_dataframe(df, name):
    """Affiche toutes les informations sur un DataFrame"""
    if df is None:
        print(f"\n❌ {name}: Fichier non trouvé ou vide")
        return
    
    print(f"\n{'='*80}")
    print(f"📊 {name}")
    print(f"{'='*80}")
    
    # Informations de base
    print(f"\n📏 Dimensions: {df.shape[0]} lignes × {df.shape[1]} colonnes")
    
    # Colonnes et types
    print(f"\n📋 Colonnes ({len(df.columns)}):")
    print("-" * 80)
    for col in df.columns:
        dtype = df[col].dtype
        non_null = df[col].notna().sum()
        null_count = df[col].isna().sum()
        null_pct = (null_count / len(df)) * 100 if len(df) > 0 else 0
        
        print(f"  • {col:30s} | Type: {str(dtype):15s} | Non-null: {non_null:6d} ({100-null_pct:.1f}%)")
    
    # Types de données par colonne
    print(f"\n🔢 Types de données:")
    print("-" * 80)
    type_counts = df.dtypes.value_counts()
    for dtype, count in type_counts.items():
        print(f"  • {str(dtype):20s}: {count} colonnes")
    
    # Statistiques descriptives pour les colonnes numériques
    numeric_cols = df.select_dtypes(include=['int64', 'float64', 'int32', 'float32']).columns
    if len(numeric_cols) > 0:
        print(f"\n📈 Statistiques descriptives (colonnes numériques):")
        print("-" * 80)
        print(df[numeric_cols].describe().to_string())
    
    # Valeurs uniques pour les colonnes catégorielles (limité à 20)
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    if len(categorical_cols) > 0:
        print(f"\n🏷️  Valeurs uniques (colonnes catégorielles, max 20 valeurs):")
        print("-" * 80)
        for col in categorical_cols[:10]:  # Limiter à 10 colonnes pour ne pas surcharger
            unique_vals = df[col].unique()
            unique_count = len(unique_vals)
            print(f"\n  • {col} ({unique_count} valeurs uniques):")
            if unique_count <= 20:
                for val in unique_vals[:20]:
                    count = (df[col] == val).sum()
                    print(f"      - {val}: {count} fois")
            else:
                print(f"      (Trop de valeurs, affichage des 10 premières)")
                for val in unique_vals[:10]:
                    count = (df[col] == val).sum()
                    print(f"      - {val}: {count} fois")
                print(f"      ... et {unique_count - 10} autres valeurs")
    
    # Aperçu des données
    print(f"\n👀 Aperçu des données (5 premières lignes):")
    print("-" * 80)
    print(df.head().to_string())
    
    # Informations sur les valeurs manquantes
    missing = df.isnull().sum()
    if missing.sum() > 0:
        print(f"\n⚠️  Valeurs manquantes:")
        print("-" * 80)
        for col, count in missing[missing > 0].items():
            pct = (count / len(df)) * 100
            print(f"  • {col:30s}: {count:6d} ({pct:.1f}%)")
    else:
        print(f"\n✅ Aucune valeur manquante")

def inspect_embeddings(embeddings, name):
    """Affiche les informations sur les embeddings PyTorch"""
    if embeddings is None:
        print(f"\n❌ {name}: Fichier non trouvé ou vide")
        return
    
    print(f"\n{'='*80}")
    print(f"🔢 {name}")
    print(f"{'='*80}")
    
    if isinstance(embeddings, dict):
        print(f"\n📦 Type: Dictionnaire")
        print(f"📏 Nombre d'éléments: {len(embeddings)}")
        
        # Afficher les clés (IDs)
        keys = list(embeddings.keys())
        print(f"\n🔑 Clés (IDs) - 10 premiers: {keys[:10]}")
        if len(keys) > 10:
            print(f"   ... et {len(keys) - 10} autres IDs")
        
        # Afficher la forme du premier embedding
        if len(keys) > 0:
            first_key = keys[0]
            first_emb = embeddings[first_key]
            if isinstance(first_emb, torch.Tensor):
                print(f"\n📐 Shape du premier embedding (ID={first_key}): {first_emb.shape}")
                print(f"   Type: {first_emb.dtype}")
                print(f"   Device: {first_emb.device}")
            else:
                print(f"\n📐 Premier embedding (ID={first_key}): {type(first_emb)}")
                print(f"   Valeur: {first_emb}")
    
    elif isinstance(embeddings, torch.Tensor):
        print(f"\n📦 Type: Tensor PyTorch")
        print(f"📐 Shape: {embeddings.shape}")
        print(f"   Type: {embeddings.dtype}")
        print(f"   Device: {embeddings.device}")
        print(f"   Nombre d'éléments: {embeddings.numel()}")
        
        # Statistiques
        if embeddings.numel() > 0:
            print(f"\n📊 Statistiques:")
            print(f"   Min: {embeddings.min().item():.4f}")
            print(f"   Max: {embeddings.max().item():.4f}")
            print(f"   Mean: {embeddings.mean().item():.4f}")
            print(f"   Std: {embeddings.std().item():.4f}")
    else:
        print(f"\n📦 Type: {type(embeddings)}")
        print(f"   Contenu: {embeddings}")

def main():
    print("🔍 INSPECTION DES DONNÉES")
    print("="*80)
    
    # Inspecter les fichiers parquet
    files_to_check = [
        ("jobs.parquet", "Jobs"),
        ("jobs_sample.parquet", "Jobs Sample"),
        ("students.parquet", "Students"),
        ("interactions.parquet", "Interactions")
    ]
    
    for filename, name in files_to_check:
        filepath = DATA_DIR / filename
        if filepath.exists():
            try:
                df = load_parquet_safe(filepath)
                inspect_dataframe(df, name)
            except Exception as e:
                print(f"\n❌ Erreur lors de l'inspection de {filename}: {e}")
        else:
            print(f"\n⚠️  Fichier non trouvé: {filename}")
    
    # Inspecter les embeddings
    print("\n\n" + "="*80)
    print("🔢 INSPECTION DES EMBEDDINGS")
    print("="*80)
    
    # Job embeddings
    job_emb_path = DATA_DIR / "job_embeddings.pt"
    if job_emb_path.exists():
        try:
            job_embeddings = torch.load(job_emb_path, map_location='cpu')
            inspect_embeddings(job_embeddings, "Job Embeddings")
        except Exception as e:
            print(f"\n❌ Erreur lors du chargement de job_embeddings.pt: {e}")
    else:
        print(f"\n⚠️  Fichier non trouvé: job_embeddings.pt")
    
    # User embeddings
    user_emb_path = DATA_DIR / "user_embeddings.pt"
    if user_emb_path.exists():
        try:
            user_embeddings = torch.load(user_emb_path, map_location='cpu')
            inspect_embeddings(user_embeddings, "User Embeddings")
        except Exception as e:
            print(f"\n❌ Erreur lors du chargement de user_embeddings.pt: {e}")
    else:
        print(f"\n⚠️  Fichier non trouvé: user_embeddings.pt")
    
    print("\n" + "="*80)
    print("✅ Inspection terminée")
    print("="*80)

if __name__ == "__main__":
    main()
