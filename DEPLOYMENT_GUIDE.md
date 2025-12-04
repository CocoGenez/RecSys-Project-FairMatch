# 🚀 Deployment guide - FairMatch

## 📊 System Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   Frontend          │────────▶│   AWS EC2 Instance   │
│   (Next.js)         │  HTTP   │   Backend API        │
│   Port 3000         │         │   (FastAPI)          │
│   Déployé en Local  │         │   Port 8000          │
└─────────────────────┘         └──────────────────────┘
                                          │
                                          │ PostgreSQL
                                          ▼
                                ┌──────────────────────┐
                                │   AWS RDS            │
                                │   PostgreSQL DB      │
                                │   Port 5432          │
                                └──────────────────────┘
```

### Components

- **Frontend (Next.js)** : User Interface, Currently running locally `http://localhost:3000`
- **Backend (FastAPI)** : API REST on EC2 AWS `http://13.221.63.255:8000`
- **Base de données (PostgreSQL)** : On AWS RDS
- **ML Service** : Locally for now (To be deployed later)

---

## 🎯 Prerequisites

- Node.js 18+ and npm installed
- Docker and Docker Compose installed (for local development)
- Access to the GitHub repository
- Environment variables (request to the project manager)

---

## 📦 Installation and Deployment

### 1️⃣ Clone the project

```bash
git clone https://github.com/CocoGenez/RecSys-Project-FairMatch.git
cd RecSys-Project-FairMatch
git checkout Paul
```

### 2️⃣ Backend Configuration (already deployed on EC2)

The backend is already running on AWS EC2. You don’t need to do anything for the backend; it is accessible at:

```
http://13.221.63.255:8000
```

**Health test :**
```bash
curl http://13.221.63.255:8000/
# Expected response : {"status":"ok","message":"FairMatch API is running","version":"1.0"}
```

**API Documentation (Swagger) :**
```
http://13.221.63.255:8000/docs
```

### 3️⃣ Run the Frontend Locally

#### Install the dependencies

```bash
cd frontend
npm install
```

#### Configuration

The file frontend/lib/api.ts is already configured to point to the EC2:

```typescript
const API_URL = 'http://13.221.63.255:8000';
```

#### Start the frontend

```bash
npm run dev
```

The frontend will be accessible at : `http://localhost:3000`

### 4️⃣ Test the Application

1. Open your browser : `http://localhost:3000`
2. Create an account (Register)
3. Log in (Login)
4. Test the CV upload feature
5. Test the swipe system

---

## 🔧 Local Development (Backend)

If you want to test the backend locally (optional):

### Prerequisites
- Python 3.12+
- Docker and Docker Compose

### Environment Variables

The `backend/.env` file is already included in the repository with all the necessary configurations. You don’t need to set anything up! 🎉

### Run with Docker

```bash
cd RecSys-Project-FairMatch
docker compose up backend
```

The local backend will be running at `http://localhost:8000`

### Run without Docker

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📁 Project Structure

```
RecSys-Project-FairMatch/
├── backend/                  # API FastAPI (Python)
│   ├── main.py              # Entry Point
│   ├── routers/             # API Routes
│   ├── lib/                 # Database, models, schemas
│   ├── models/              # ML models
│   ├── Processed/           # Processed Data
│   └── requirements.txt     # Python Dependencies
│
├── frontend/                # Next.js Application
│   ├── app/                 # Pages and layouts
│   ├── components/          # React compenents
│   ├── lib/                 # Utils and API clients
│   └── package.json         # Node.js dependencies
│
├── backend-ml/              # ML Service (to be deployed)
│   ├── app.py
│   └── requirements.txt
│
├── docker-compose.yml       # Docker configuration
└── DEPLOYMENT_GUIDE.md      # This file
```

---

## 🌐 Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | `http://localhost:3000` | User Interface |
| Backend API | `http://13.221.63.255:8000` | API REST (production) |
| API Docs | `http://13.221.63.255:8000/docs` | Swagger Documentation |
| Base de données | `fairmatch-db.c418ksio6pdy.us-east-1.rds.amazonaws.com:5432` | PostgreSQL RDS |

---

## 🔑 Main API Endpoints

### Authentication
- `POST /auth/register` - Create an account
- `POST /auth/login` - Login
- `GET /auth/me` - User profile

### Resume
- `POST /api/parse-resume` - Parse a CV (multipart/form-data)

### Recommendations
- `GET /recommend/{user_id}` - Get recommandations

### Interactions
- `POST /interactions/` - Save an Interaction (like/dislike)
- `GET /interactions/user/{user_id}` - User History

---

## 🐛 Troubleshooting

### The frontend doesn’t start

```bash
# Delete node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### API Connection Error

1. Check that the EC2 API is accessible:
   ```bash
   curl http://13.221.63.255:8000/
   ```

2. Check the configuration in `frontend/lib/api.ts`

3. Check the browser logs (DevTools Console)

### CORS Error

The backend is configured to allow all origins in development. If you encounter CORS errors, contact the project manager.

---

## 🚀 Backend deployment (For admins only)

**This section is reserved for the project manager.**

### Connect to the EC2

```bash
ssh -i ~/.ssh/fairmatch-ec2-key.pem ubuntu@13.221.63.255
```

### Update the code

```bash
cd ~/RecSys-Project-FairMatch
git pull origin Paul
docker compose up -d backend --build
```

### See logs

```bash
docker compose logs -f backend
```

### Restart the backend

```bash
docker compose restart backend
```

---

## 📝 TODO - Next steps

- [ ] Deploy the frontend on Vercel/Netlify (Vercel for us)
- [ ] Deploy the ML service on a separate EC2 instance
- [ ] Set up a domain name
- [ ] Add HTTPS with an SSL certificate
- [ ] Set up CI/CD with GitHub Actions
- [ ] Add monitoring and alerts

---

## 👥 Support

**Issues or Questions ?**
- Create an issue on GitHub
- Contact the project manager : Corentin Gaude

---

## 📄 License

Academical project - ING5 RecSys

**Last update :** 2 décembre 2025
