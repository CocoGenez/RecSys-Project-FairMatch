import pandas as pd
import torch
from pathlib import Path
import random
from sentence_transformers import util
from tqdm import tqdm  # Pour la barre de progression

# --- CONFIGURATION ---
root = Path(__file__).parent
processed_dir = root.parent / "Processed"

# Fichiers d'entrée
interactions_path = processed_dir / "interactions_export.csv"
jobs_path = processed_dir / "jobs.parquet"
job_emb_path = processed_dir / "job_embeddings.pt"

# Fichier de sortie
output_path = processed_dir / "interactions_augmented.csv"

# Paramètres d'augmentation
SIMILAR_JOBS_TO_ADD = 3  # Pour chaque vrai LIKE, on ajoute 3 jobs similaires
NEGATIVE_RATIO = 1.2     # On ajoute un peu plus de PASS pour garder l'équilibre

def augment_data():
    print("Démarrage de l'augmentation des données")

    # 1. Chargement des données
    try:
        try:
            df_inter = pd.read_csv(interactions_path, encoding='utf-8')
        except:
            df_inter = pd.read_csv(interactions_path, encoding='latin1')
            
        df_jobs = pd.read_parquet(jobs_path)
        job_emb = torch.load(job_emb_path)
        print(f"Données chargées : {len(df_inter)} interactions, {len(df_jobs)} jobs.")
    except Exception as e:
        print(f"Erreur de chargement : {e}")
        return

    # Mappage des IDs de jobs vers les index des embeddings
    # Important pour retrouver quel vecteur correspond à quel job_id
    if 'jobid' in df_jobs.columns:
        job_ids = df_jobs['jobid'].astype(str).tolist()
    else:
        job_ids = df_jobs.index.astype(str).tolist()
    
    # Dictionnaire inverse : Index -> JobID
    idx_to_jobid = {i: jid for i, jid in enumerate(job_ids)}
    # Dictionnaire : JobID -> Index
    jobid_to_idx = {jid: i for i, jid in enumerate(job_ids)}

    # On ne garde que les colonnes utiles
    new_rows = []
    
    # Set pour éviter les doublons (User, Job)
    existing_pairs = set(zip(df_inter['user_id'].astype(str), df_inter['item_id'].astype(str)))

    # 2. Augmentation des LIKES (Item-Item Similarity)
    print("Génération des interactions positives (Likes similaires)")
    
    # On ne prend que les vrais likes
    likes_only = df_inter[df_inter['action'] == 'like']
    
    for _, row in tqdm(likes_only.iterrows(), total=len(likes_only)):
        user_id = str(row['user_id'])
        original_job_id = str(row['item_id'])
        
        if original_job_id not in jobid_to_idx:
            continue
            
        # Récupérer l'embedding du job aimé
        idx = jobid_to_idx[original_job_id]
        target_emb = job_emb[idx]
        
        # Calculer la similarité avec TOUS les autres jobs
        # cos_sim renvoie (1, N_jobs)
        scores = util.cos_sim(target_emb, job_emb)[0]
        
        # Trouver les top K jobs les plus proches (on exclut le job lui-même)
        # topk renvoie values et indices. On prend k+1 pour pouvoir retirer l'original
        top_results = torch.topk(scores, k=SIMILAR_JOBS_TO_ADD + 1)
        
        count = 0
        for score, neighbor_idx in zip(top_results.values, top_results.indices):
            neighbor_idx = neighbor_idx.item()
            neighbor_job_id = idx_to_jobid[neighbor_idx]
            
            # On saute si c'est le même job ou si l'interaction existe déjà
            if neighbor_job_id == original_job_id or (user_id, neighbor_job_id) in existing_pairs:
                continue
            
            # On ajoute le nouveau like artificiel
            new_rows.append({
                'user_id': int(user_id) if user_id.isdigit() else user_id,
                'item_id': int(neighbor_job_id) if neighbor_job_id.isdigit() else neighbor_job_id,
                'action': 'like',
                'type': 'augmented_positive', # Pour tracer l'origine
                'timestamp': row['timestamp'] # On garde le même timestamp ou on met now()
            })
            existing_pairs.add((user_id, neighbor_job_id))
            
            count += 1
            if count >= SIMILAR_JOBS_TO_ADD:
                break

    print(f"   -> {len(new_rows)} nouveaux LIKES générés.")

    # 3. Augmentation des PASS (Negative Sampling) pour équilibrer
    print("Génération des interactions négatives (Random Pass)")
    
    # On vise un ratio (ex: autant de pass que de total likes actuels + nouveaux)
    total_likes = len(likes_only) + len(new_rows)
    target_pass = int(total_likes * NEGATIVE_RATIO)
    current_pass = len(df_inter[df_inter['action'] == 'pass'])
    needed_pass = max(0, target_pass - current_pass)
    
    print(f"   Objectif PASS: {target_pass}. Actuels: {current_pass}. À générer: {needed_pass}")
    
    unique_users = df_inter['user_id'].unique()
    
    pass_generated = 0
    pbar = tqdm(total=needed_pass)
    
    while pass_generated < needed_pass:
        # Tirage aléatoire
        u = random.choice(unique_users)
        # On tire un index aléatoire dans les jobs
        rand_idx = random.randint(0, len(job_ids) - 1)
        j = idx_to_jobid[rand_idx]
        
        u_str, j_str = str(u), str(j)
        
        if (u_str, j_str) not in existing_pairs:
            new_rows.append({
                'user_id': u,
                'item_id': j if str(j).isdigit() else j, # Garder le type original si possible
                'action': 'pass',
                'type': 'augmented_negative',
                'timestamp': df_inter.iloc[0]['timestamp'] # timestamp placeholder
            })
            existing_pairs.add((u_str, j_str))
            pass_generated += 1
            pbar.update(1)
            
    pbar.close()

    # 4. Fusion et Sauvegarde
    print("Sauvegarde")
    df_augmented = pd.DataFrame(new_rows)
    
    # S'assurer que les colonnes correspondent à l'original (pour concat)
    # L'original n'a pas la colonne 'type', on l'ajoute pour info ou on la retire
    # Pour la compatibilité avec training.py, il vaut mieux avoir les mêmes colonnes
    df_augmented_clean = df_augmented[['user_id', 'item_id', 'action', 'timestamp']]
    
    df_final = pd.concat([df_inter, df_augmented_clean], ignore_index=True)
    
    # Shuffle (mélanger) les données
    df_final = df_final.sample(frac=1).reset_index(drop=True)
    
    df_final.to_csv(output_path, index=False)
    
    print(f"Terminé ! Nouveau dataset sauvegardé sous : {output_path}")
    print(f"   Taille originale : {len(df_inter)}")
    print(f"   Taille finale    : {len(df_final)}")
    print(f"   Distribution : \n{df_final['action'].value_counts()}")

if __name__ == "__main__":
    augment_data()