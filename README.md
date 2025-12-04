# FairMatch

**FairMatch** is a modern, interactive recruitment application that brings the "swipe" experience to job hunting. It connects job seekers (and in the future recruiters) through a dynamic interface, allowing them to discover matches efficiently.

The project is currently hosted on : https://fairmatch.vercel.app/ with the backend being at http://13.221.63.255:8000 and the database at postgresql://fairmatch_admin:fairmatch_admin_password@fairmatch-db.c418ksio6pdy.us-east-1.rds.amazonaws.com:5432/postgres

## Team Members

*   Alexis Boulic
*   Corentin Gaude
*   Ikram Amine
*   Paul Busetta
*   Rayan Gregoire

---

## 🚀 Local Setup Guide

Follow these steps to run the system locally on your machine.

### Prerequisites

*   **Git**
*   **Python 3.12+**
*   **Node.js 18+**
*   **PostgreSQL** (or Docker to run the database)

### 1. Clone the Repository

```bash
git clone https://github.com/CocoGenez/RecSys-Project-FairMatch.git
cd RecSys-Project-FairMatch
```

### 2. Backend Setup

The backend is built with **FastAPI**.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Create a virtual environment:
    ```bash
    # Windows
    python -m venv venv
    .\venv\Scripts\activate

    # macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Database Configuration**:
    You need a running PostgreSQL database.
    *   **Option A (Docker)**: Run `docker-compose -f docker-compose.local.yml up -d postgres` from the root directory to start a local DB container.
    *   **Option B (Manual)**: Ensure you have a local Postgres server running and update the `.env` file (or environment variables) with your credentials.
        *   Default expected URL: `postgresql://fairmatch_local:fairmatch_local_password@localhost:5432/fairmatch_local`

5.  Run the application:
    ```bash
    uvicorn main:app --reload
    ```
    The API will be available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

Let a bit of time for the backend to start up.

## Testing the Setup

### 1. Check Backend Health

Let a bit of time for the backend to start up.

```powershell
curl http://localhost:8000/
```

Expected response:
```json
{"status":"ok","message":"FairMatch API is running","version":"1.0"}
```

### 2. Test Database Connection

```powershell
curl http://localhost:8000/auth/users/1
```

Should return user data or 404 if no users exist.

### 3. Frontend Setup

The frontend is built with **Next.js**.

1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser and visit:
    ```
    http://localhost:3000
    ```
If the frontent is still loading after a while, just refresh the page.
---

## Model Retraining

The recommendation system uses a neural network classifier to predict matches based on user and job embeddings.

### Prerequisites for Retraining

Ensure you have the following data files in `backend/Processed/`:
*   `interactions_export.csv` (User-Job interactions)
*   `users_export.csv` (User profiles)
*   `jobs.parquet` (Job details)
*   `job_embeddings.pt` (Pre-computed job embeddings)

### How to Retrain

1.  Activate your backend virtual environment (if not already active).

2.  Run the training script:
    ```bash
    cd backend/models
    python training.py
    ```

3.  **What happens?**
    *   The script loads interactions and user/job data.
    *   It generates fresh user embeddings using `SentenceTransformer`.
    *   It trains a `RecSysClassifier` model to predict the probability of a "like".
    *   The best model is saved to `backend/models/classifier.pt`.

4.  **Using the new model**:
    Restart the backend server to load the newly trained `classifier.pt`.

---

## Docker Quick Start (Alternative)

This method runs the **Backend** and **Database** in Docker containers, while the **Frontend** runs locally on your machine.

1.  **Start Backend & Database**:
    Run the following command from the project root:
    ```bash
    docker-compose -f docker-compose.local.yml up -d
    ```

2.  **Start Frontend**:
    Open a new terminal and run:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

3.  Access the app at `http://localhost:3000`.
