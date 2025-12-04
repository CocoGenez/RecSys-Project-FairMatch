# 🏠 FairMatch - Local Development Setup

Complete guide for running FairMatch entirely on your local machine with Docker Compose.

## 📋 Prerequisites

- **Docker Desktop** installed and running
- **Node.js 18+** and npm installed
- **Git** installed

---

## 🚀 Quick Start (3 Steps)

### 1️⃣ Start the Local Stack

From the project root directory:

```powershell
# Start PostgreSQL + Backend
docker-compose up -d

# Check that services are running
docker-compose ps
```

Expected output:
```
NAME                         STATUS    PORTS
fairmatch-postgres-local     Up        0.0.0.0:5432->5432/tcp
fairmatch-backend-local      Up        0.0.0.0:8000->8000/tcp
```

### 2️⃣ Start the Frontend

In a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### 3️⃣ Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **PostgreSQL**: `localhost:5432`

---

## 🔧 Detailed Configuration

### Database Connection

**Local PostgreSQL credentials** (configured in `docker-compose.yml`):
```
Host: localhost (or 'postgres' inside Docker network)
Port: 5432
Database: fairmatch_local
User: fairmatch_local
Password: fairmatch_local_password
```

**Connection string** (in `backend/.env.local`):
```
DATABASE_URL=postgresql://fairmatch_local:fairmatch_local_password@postgres:5432/fairmatch_local
```

### Database Schema

The database is automatically initialized with:
- ✅ `users` table (with all profile fields)
- ✅ `interactions` table (likes/passes)
- ✅ Indexes for performance
- ✅ Sample test user (`test@fairmatch.com` / password: `password`)

Schema file: `backend/init.sql`

---

## 🛠️ Common Commands

### Docker Compose

```powershell
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f postgres

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build

# Stop and remove volumes (fresh start)
docker-compose down -v
```

### Database Access

Connect to PostgreSQL directly:

```powershell
# Using psql (if installed)
psql "postgresql://fairmatch_local:fairmatch_local_password@localhost:5432/fairmatch_local"

# Using Docker exec
docker exec -it fairmatch-postgres-local psql -U fairmatch_local -d fairmatch_local
```

Common queries:

```sql
-- List all users
SELECT id, name, email, role FROM users;

-- List recent interactions
SELECT * FROM interactions ORDER BY id DESC LIMIT 10;

-- Count interactions by user
SELECT user_id, COUNT(*) FROM interactions GROUP BY user_id;
```

---

## 🔄 Development Workflow

### Making Backend Changes

1. Edit backend code
2. Rebuild and restart:
   ```powershell
   docker-compose up -d --build backend
   ```

### Making Frontend Changes

Frontend has hot-reload enabled - just save your changes!

### Database Changes

If you modify `backend/init.sql`:

```powershell
# Stop and remove database volume
docker-compose down -v

# Start fresh (will re-run init.sql)
docker-compose up -d
```

---

## 🧪 Testing the Setup

### 1. Check Backend Health

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

### 3. Create a Test User

Via the frontend:
1. Go to http://localhost:3000
2. Click "Register"
3. Fill in the form and submit

Or via API:
```powershell
curl -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d '{
  "email": "demo@example.com",
  "password": "password123",
  "role": "jobseeker",
  "name": "Demo User"
}'
```

---

## 🐛 Troubleshooting

### Backend won't start

Check logs:
```powershell
docker-compose logs backend
```

Common issues:
- Database not ready → wait 10 seconds and try again
- Port 8000 in use → stop other services or change port in `docker-compose.yml`

### Database connection failed

Ensure PostgreSQL is running:
```powershell
docker-compose ps postgres
```

Should show "Up" status. If not:
```powershell
docker-compose up -d postgres
docker-compose logs postgres
```

### Frontend can't connect to backend

Check `frontend/lib/api.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

Create `frontend/.env.local` if needed:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Fresh database needed

```powershell
# Nuclear option - removes all data
docker-compose down -v
docker-compose up -d
```

---

## 📊 Architecture Overview

```
┌─────────────────────┐         ┌──────────────────────┐
│   Frontend          │────────▶│   Backend            │
│   Next.js           │  HTTP   │   FastAPI            │
│   localhost:3000    │         │   localhost:8000     │
└─────────────────────┘         └──────────────────────┘
                                          │
                                          │ SQL
                                          ▼
                                ┌──────────────────────┐
                                │   PostgreSQL         │
                                │   Docker Container   │
                                │   localhost:5432     │
                                └──────────────────────┘
```

### Components

- **Frontend (Next.js)**: React-based UI with Tailwind CSS
- **Backend (FastAPI)**: REST API with authentication, recommendations
- **Database (PostgreSQL)**: Local persistent storage
- **ML Models**: Pre-trained embeddings in `backend/Processed/`

---

## 🔐 Default Credentials

**Test User** (pre-created in database):
```
Email: test@fairmatch.com
Password: password
Role: jobseeker
```

**Database Admin**:
```
User: fairmatch_local
Password: fairmatch_local_password
Database: fairmatch_local
```

---

## 📦 Optional: ML Service

To enable the separate ML service (port 8001):

```powershell
docker-compose --profile ml up -d
```

This is optional - the main backend already includes recommendation functionality.

---

## 🚨 Important Notes

- **Data Persistence**: Database data is stored in a Docker volume (`postgres_data`)
- **Data is NOT shared** with the cloud deployment (AWS RDS)
- To reset everything: `docker-compose down -v`
- Backend code changes require rebuild: `docker-compose up -d --build backend`
- Frontend has hot-reload - no rebuild needed

---

## 🎯 Next Steps

1. ✅ Verify all services are running: `docker-compose ps`
2. ✅ Access frontend: http://localhost:3000
3. ✅ Create a user account
4. ✅ Upload a resume (uses Gemini API)
5. ✅ Test job recommendations and swiping

---

## 📞 Need Help?

Check logs for errors:
```powershell
docker-compose logs -f
```

Connect to database:
```powershell
docker exec -it fairmatch-postgres-local psql -U fairmatch_local -d fairmatch_local
```

Backend API docs:
http://localhost:8000/docs
