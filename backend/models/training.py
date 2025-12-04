import torch
print("Script started...")
import torch.nn as nn
import torch.optim as optim
import pandas as pd
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
from torch.utils.data import Dataset, DataLoader
import sys
import os

# Add parent directory to path to allow imports if needed
sys.path.append(str(Path(__file__).parent.parent))

# Define paths
root = Path(__file__).parent
processed_dir = root.parent / "Processed"
interactions_path = processed_dir / "interactions_export.csv" # "interactions_export.csv for the original dataset, interactions_augmented.csv"
users_path = processed_dir / "users_export.csv"
jobs_path = processed_dir / "jobs.parquet"
job_emb_path = processed_dir / "job_embeddings.pt"
model_save_path = root / "classifier.pt"

# Load SentenceTransformer for user embeddings
try:
    st_model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception as e:
    print(f"Error loading SentenceTransformer: {e}")
    st_model = None

class RecSysClassifier(nn.Module):
    def __init__(self, input_dim=768, hidden_dim=128):
        super(RecSysClassifier, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)
        self.fc2 = nn.Linear(hidden_dim, 64)
        self.fc3 = nn.Linear(64, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.dropout(x)
        x = self.fc2(x)
        x = self.relu(x)
        x = self.fc3(x)
        return self.sigmoid(x)

class InteractionDataset(Dataset):
    def __init__(self, user_embeddings, job_embeddings, labels):
        self.user_embeddings = user_embeddings
        self.job_embeddings = job_embeddings
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return (
            self.user_embeddings[idx],
            self.job_embeddings[idx],
            self.labels[idx]
        )

def build_user_profile_text(row):
    # Construct profile text similar to data_pipeline_new.py
    # Adjust column names based on users_export.csv
    # users_export.csv columns: id, email, username, role, name, gender, interested_domain, age, projects, future_career, Python_Level, SQL_Level, Java_Level
    
    # Handle potential missing values
    def safe_str(val):
        return str(val) if pd.notna(val) else ""

    return (
        f"gender {safe_str(row.get('gender', ''))}, age {safe_str(row.get('age', ''))}, "
        f"interested domain {safe_str(row.get('interested_domain', ''))}, "
        f"projects {safe_str(row.get('projects', ''))}, "
        f"skills python {safe_str(row.get('Python_Level', ''))}, sql {safe_str(row.get('SQL_Level', ''))}, java {safe_str(row.get('Java_Level', ''))}."
    )

def train_model(epochs=20, batch_size=32, lr=0.001):
    print("Loading data...")
    
    # Load Data
    try:
        try:
            interactions = pd.read_csv(interactions_path, encoding='utf-8')
        except UnicodeDecodeError:
            print("Warning: interactions.csv not UTF-8, trying latin1")
            interactions = pd.read_csv(interactions_path, encoding='latin1')
            
        try:
            users = pd.read_csv(users_path, encoding='utf-8')
        except UnicodeDecodeError:
            print("Warning: users.csv not UTF-8, trying latin1")
            users = pd.read_csv(users_path, encoding='latin1')

        jobs = pd.read_parquet(jobs_path)
        job_emb = torch.load(job_emb_path)
    except Exception as e:
        print(f"Error loading files: {e}")
        return

    print(f"Interactions: {len(interactions)}")
    print(f"Users: {len(users)}")
    print(f"Jobs: {len(jobs)}")

    # Filter interactions
    # Keep only 'like' (1) and 'pass' (0)
    interactions = interactions[interactions['action'].isin(['like', 'pass'])].copy()
    interactions['label'] = interactions['action'].apply(lambda x: 1.0 if x == 'like' else 0.0)
    
    print(f"Filtered Interactions: {len(interactions)}")
    print(interactions['label'].value_counts())

    # Generate User Embeddings
    print("Generating user embeddings...")
    user_emb_map = {}
    
    # Ensure users have 'id' column matching interactions 'user_id'
    # users_export.csv has 'id'
    
    for idx, row in users.iterrows():
        uid = row['id']
        text = build_user_profile_text(row)
        emb = st_model.encode(text, convert_to_tensor=True)
        user_emb_map[uid] = emb

    # Prepare Training Data
    X_user = []
    X_job = []
    y = []

    # Map job_id to embedding index
    # jobs.parquet index is likely the job_id if it was saved that way, or we need to look it up
    # base_model.py loads job_emb which corresponds to jobs_sample.parquet (or jobs.parquet)
    # We assume job_emb aligns with jobs DataFrame index or order
    
    # Let's verify job alignment. 
    # If job_emb was created from jobs.parquet, then index i in job_emb corresponds to row i in jobs.
    # We need to map job_id from interactions to this index.
    
    # Create a mapping from job_id (in dataframe) to index (0..N)
    # jobs dataframe might have 'jobid' column or be indexed by it.
    
    job_id_to_idx = {}
    if 'jobid' in jobs.columns:
        for idx, jid in enumerate(jobs['jobid']):
            job_id_to_idx[jid] = idx
    else:
        # Assume index is jobid
        for idx in range(len(jobs)):
            job_id_to_idx[jobs.index[idx]] = idx

    valid_samples = 0
    for idx, row in interactions.iterrows():
        uid = row['user_id']
        jid = row['item_id'] # interactions.csv has 'item_id' for job
        label = row['label']

        if uid in user_emb_map and jid in job_id_to_idx:
            job_idx = job_id_to_idx[jid]
            if job_idx < len(job_emb):
                X_user.append(user_emb_map[uid])
                X_job.append(job_emb[job_idx])
                y.append(label)
                valid_samples += 1

    print(f"Valid training samples: {valid_samples}")

    if valid_samples == 0:
        print("No valid samples found. Check ID matching.")
        return

    X_user = torch.stack(X_user)
    X_job = torch.stack(X_job)
    y = torch.tensor(y, dtype=torch.float32).unsqueeze(1)

    # Split Train/Val
    dataset_size = len(y)
    indices = list(range(dataset_size))
    split = int(np.floor(0.2 * dataset_size))
    np.random.shuffle(indices)
    train_indices, val_indices = indices[split:], indices[:split]

    train_dataset = InteractionDataset(X_user[train_indices], X_job[train_indices], y[train_indices])
    val_dataset = InteractionDataset(X_user[val_indices], X_job[val_indices], y[val_indices])

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size)

    # Initialize Model
    model = RecSysClassifier()
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)

    # Training Loop
    print("Starting training...")
    best_loss = float('inf')
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        for u_emb, j_emb, labels in train_loader:
            # Concatenate user and job embeddings
            inputs = torch.cat((u_emb, j_emb), dim=1)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
        
        epoch_loss = running_loss / len(train_dataset)
        
        # Validation
        model.eval()
        val_loss = 0.0
        correct = 0
        total = 0
        with torch.no_grad():
            for u_emb, j_emb, labels in val_loader:
                inputs = torch.cat((u_emb, j_emb), dim=1)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * inputs.size(0)
                
                predicted = (outputs > 0.5).float()
                total += labels.size(0)
                correct += (predicted == labels).sum().item()

        val_loss = val_loss / len(val_dataset)
        acc = correct / total
        
        print(f"Epoch {epoch+1}/{epochs} - Train Loss: {epoch_loss:.4f} - Val Loss: {val_loss:.4f} - Val Acc: {acc:.4f}")

        if val_loss < best_loss:
            best_loss = val_loss
            torch.save(model.state_dict(), model_save_path)
            print("  Saved best model.")

    print(f"Training complete. Model saved to {model_save_path}")

if __name__ == "__main__":
    train_model()
