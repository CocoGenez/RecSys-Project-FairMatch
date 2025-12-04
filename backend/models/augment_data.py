import pandas as pd
import torch
from pathlib import Path
import random
from sentence_transformers import util
from tqdm import tqdm  # For progress bar

# --- CONFIGURATION ---
root = Path(__file__).parent
processed_dir = root.parent / "Processed"

# Input files
interactions_path = processed_dir / "interactions_export.csv"
jobs_path = processed_dir / "jobs.parquet"
job_emb_path = processed_dir / "job_embeddings.pt"

# Output file
output_path = processed_dir / "interactions_augmented.csv"

# Augmentation parameters
SIMILAR_JOBS_TO_ADD = 3  # For each true LIKE, add 3 similar jobs
NEGATIVE_RATIO = 1.2     # Add a bit more PASS to maintain balance

def augment_data():
    print("Démarrage de l'augmentation des données")

    # 1. Load data
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

    # Job ID to embedding index mapping
    # Important to find which vector corresponds to which job_id
    if 'jobid' in df_jobs.columns:
        job_ids = df_jobs['jobid'].astype(str).tolist()
    else:
        job_ids = df_jobs.index.astype(str).tolist()
    
    # Reverse dictionary: Index -> JobID
    idx_to_jobid = {i: jid for i, jid in enumerate(job_ids)}
    # Dictionary: JobID -> Index
    jobid_to_idx = {jid: i for i, jid in enumerate(job_ids)}

    # Keep only useful columns
    new_rows = []
    
    # Set to avoid duplicates (User, Job)
    existing_pairs = set(zip(df_inter['user_id'].astype(str), df_inter['item_id'].astype(str)))

    # 2. LIKES augmentation (Item-Item Similarity)
    print("Génération des interactions positives (Likes similaires)")
    
    # Keep only real likes
    likes_only = df_inter[df_inter['action'] == 'like']
    
    for _, row in tqdm(likes_only.iterrows(), total=len(likes_only)):
        user_id = str(row['user_id'])
        original_job_id = str(row['item_id'])
        
        if original_job_id not in jobid_to_idx:
            continue
            
        # Get the embedding of the liked job
        idx = jobid_to_idx[original_job_id]
        target_emb = job_emb[idx]
        
        # Calculate similarity with ALL other jobs
        # cos_sim returns (1, N_jobs)
        scores = util.cos_sim(target_emb, job_emb)[0]
        
        # Find the top K closest jobs (exclude the job itself)
        # topk returns values and indices. Take k+1 to be able to remove the original
        top_results = torch.topk(scores, k=SIMILAR_JOBS_TO_ADD + 1)
        
        count = 0
        for score, neighbor_idx in zip(top_results.values, top_results.indices):
            neighbor_idx = neighbor_idx.item()
            neighbor_job_id = idx_to_jobid[neighbor_idx]
            
            # Skip if it's the same job or if the interaction already exists
            if neighbor_job_id == original_job_id or (user_id, neighbor_job_id) in existing_pairs:
                continue
            
            # Add the new artificial like
            new_rows.append({
                'user_id': int(user_id) if user_id.isdigit() else user_id,
                'item_id': int(neighbor_job_id) if neighbor_job_id.isdigit() else neighbor_job_id,
                'action': 'like',
                'type': 'augmented_positive', # To trace the origin
                'timestamp': row['timestamp'] # Keep the same timestamp or use now()
            })
            existing_pairs.add((user_id, neighbor_job_id))
            
            count += 1
            if count >= SIMILAR_JOBS_TO_ADD:
                break

    print(f"   -> {len(new_rows)} nouveaux LIKES générés.")

    # 3. PASS augmentation (Negative Sampling) for balance
    print("Génération des interactions négatives (Random Pass)")
    
    # Aim for a ratio (e.g., as many pass as total current + new likes)
    total_likes = len(likes_only) + len(new_rows)
    target_pass = int(total_likes * NEGATIVE_RATIO)
    current_pass = len(df_inter[df_inter['action'] == 'pass'])
    needed_pass = max(0, target_pass - current_pass)
    
    print(f"   Target PASS: {target_pass}. Current: {current_pass}. To generate: {needed_pass}")
    
    unique_users = df_inter['user_id'].unique()
    
    pass_generated = 0
    pbar = tqdm(total=needed_pass)
    
    while pass_generated < needed_pass:
        # Random draw
        u = random.choice(unique_users)
        # Draw a random index from jobs
        rand_idx = random.randint(0, len(job_ids) - 1)
        j = idx_to_jobid[rand_idx]
        
        u_str, j_str = str(u), str(j)
        
        if (u_str, j_str) not in existing_pairs:
            new_rows.append({
                'user_id': u,
                'item_id': j if str(j).isdigit() else j, # Keep original type if possible
                'action': 'pass',
                'type': 'augmented_negative',
                'timestamp': df_inter.iloc[0]['timestamp'] # timestamp placeholder
            })
            existing_pairs.add((u_str, j_str))
            pass_generated += 1
            pbar.update(1)
            
    pbar.close()

    # 4. Merge and Save
    print("Sauvegarde")
    df_augmented = pd.DataFrame(new_rows)
    
    # Make sure columns match the original (for concat)
    # The original doesn't have the 'type' column, add it for info or remove it
    # For compatibility with training.py, it's better to have the same columns
    df_augmented_clean = df_augmented[['user_id', 'item_id', 'action', 'timestamp']]
    
    df_final = pd.concat([df_inter, df_augmented_clean], ignore_index=True)
    
    # Shuffle the data
    df_final = df_final.sample(frac=1).reset_index(drop=True)
    
    df_final.to_csv(output_path, index=False)
    
    print(f"Done! New dataset saved at: {output_path}")
    print(f"   Original size: {len(df_inter)}")
    print(f"   Final size   : {len(df_final)}")
    print(f"   Distribution : \n{df_final['action'].value_counts()}")

if __name__ == "__main__":
    augment_data()