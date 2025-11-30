# Guide Docker - Backend FairMatch

## Architecture Backend

Le backend FastAPI fournit une API REST pour l'application FairMatch :

### Fonctionnalités principales

**Authentification**
- Inscription : `POST /auth/register`
- Connexion : `POST /auth/login`
- Stockage utilisateurs dans AWS RDS PostgreSQL

**Gestion des CV**
- Upload de CV en PDF
- Parsing automatique avec Google Gemini AI
- Extraction des compétences et expériences

**Système de Recommandations ML**
- Algorithme de matching candidat-emploi
- PyTorch et SentenceTransformers
- Base de 20 000 offres d'emploi avec embeddings
- Calcul de scores de compatibilité

**Interactions**
- Gestion des likes/dislikes (jobs et candidats)
- Stockage des interactions en base de données

**Documentation API**
- Interface Swagger UI sur `/docs`
- Test des routes en temps réel

---

## Prérequis

- Docker Desktop installé et lancé
- Fichier `backend/.env` configuré (déjà présent dans le projet)

Vérification :
```bash
docker --version
docker ps
```

---

## Démarrage Rapide

### Lancer le backend Docker

```bash
# Démarrer le backend
docker-compose up -d

# Vérifier que le container tourne
docker ps

# Voir les logs
docker-compose logs -f backend
```

Le backend est accessible sur :
- API : http://localhost:8000
- Documentation : http://localhost:8000/docs

### Lancer le frontend

Dans un terminal séparé :
```bash
# Installer les dépendances (première fois uniquement)
npm install

# Démarrer le frontend
npm run dev
```

Le frontend est accessible sur http://localhost:3000

---

## Commandes Docker

### Gestion du backend

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Logs en temps réel
docker-compose logs -f backend

# Redémarrer après modification du code
docker-compose restart backend

# Rebuild complet (après modification du Dockerfile ou requirements.txt)
docker-compose up -d --build

# Voir les containers actifs
docker ps

# Supprimer complètement (avec volumes)
docker-compose down -v
```

### Frontend (npm)

```bash
# Démarrer le serveur de développement
npm run dev

# Build de production
npm run build

# Lancer en production
npm start

# Arrêter : Ctrl+C dans le terminal
```

---

## Structure Backend

```
backend/
├── routers/              # Routes API
│   ├── auth.py          # Authentification (register, login)
│   ├── resume.py        # Upload et parsing de CV
│   ├── recommendations.py # Recommandations ML
│   └── interactions.py  # Gestion des swipes
├── lib/
│   ├── database.py      # Connexion PostgreSQL
│   ├── models.py        # Modèles SQLAlchemy
│   └── schemas.py       # Schémas Pydantic
├── models/              # Modèles ML
│   ├── base_model.py    # Modèle de recommandation
│   └── data_pipeline.py # Pipeline de traitement
├── Processed/           # Données pré-traitées
│   ├── jobs.parquet     # 20k offres d'emploi
│   ├── job_embeddings.pt # Embeddings des jobs
│   └── interactions.parquet # Historique des interactions
├── Dockerfile           # Configuration Docker
├── requirements.txt     # Dépendances Python
├── .env                 # Variables d'environnement
└── main.py             # Point d'entrée FastAPI
```

---

## Configuration

### Variables d'environnement (`backend/.env`)

```env
GOOGLE_API_KEY=AIzaSyCPmvAz2qUYxrz3hmYLLdw_4GHe5t-fJn4
DATABASE_URL=postgresql://fairmatch_admin:fairmatch_admin_password@fairmatch-db.c418ksio6pdy.us-east-1.rds.amazonaws.com:5432/postgres
```

Ces variables sont déjà configurées dans le projet.

### Configuration Docker (`docker-compose.yml`)

Le fichier `docker-compose.yml` configure :
- Build de l'image depuis `backend/Dockerfile`
- Exposition du port 8000
- Chargement des variables depuis `backend/.env`
- Volume pour le hot-reload en développement

---

## Résolution de Problèmes

### Le backend ne démarre pas

```bash
# Vérifier que Docker tourne
docker ps

# Voir les erreurs dans les logs
docker-compose logs backend

# Rebuild complet
docker-compose down
docker-compose up -d --build
```

### Port 8000 déjà utilisé

```bash
# Arrêter le backend Docker
docker-compose down

# Ou tuer le processus qui utilise le port
lsof -ti:8000 | xargs kill -9
```

### Modifications du code non prises en compte

```bash
# Le hot-reload est activé, mais si problème :
docker-compose restart backend

# Si toujours pas : rebuild
docker-compose up -d --build
```

### Erreur de connexion à la base de données

- Vérifier la connexion Internet
- Vérifier que `backend/.env` contient le bon `DATABASE_URL`
- AWS RDS est accessible depuis n'importe quelle IP (configuré pour l'équipe)

### Frontend ne se connecte pas au backend

- Vérifier que le backend tourne : `docker ps`
- Vérifier que http://localhost:8000/docs est accessible
- Les URLs API dans le frontend pointent vers `http://localhost:8000`

---

## Stack Technique

### Backend
- FastAPI : Framework API REST
- SQLAlchemy : ORM pour PostgreSQL
- Pydantic : Validation de données
- PyTorch : Framework Deep Learning
- SentenceTransformers : Génération d'embeddings
- Google Gemini AI : Parsing de CV
- Uvicorn : Serveur ASGI

### Infrastructure
- Docker : Containerisation du backend
- PostgreSQL : Base de données (AWS RDS)
- AWS RDS : Hébergement base de données

### Frontend
- Next.js 14 : Framework React
- npm : Gestionnaire de paquets

---

## Workflow de Développement

### Développer une nouvelle feature

```bash
# 1. Récupérer la dernière version
git pull origin Paul

# 2. Créer une branche
git checkout -b feature/ma-feature

# 3. Modifier le code backend dans backend/

# 4. Le backend redémarre automatiquement (hot-reload)
# Si pas de redémarrage : docker-compose restart backend

# 5. Tester via http://localhost:8000/docs

# 6. Commit et push
git add .
git commit -m "Description de la feature"
git push origin feature/ma-feature
```

### Tester le code d'un collègue

```bash
# Récupérer sa branche
git fetch
git checkout sa-branche

# Rebuild le backend (si modifications Python)
docker-compose down
docker-compose up -d --build

# Réinstaller les dépendances frontend (si modifications package.json)
npm install
npm run dev
```

---

## Tester l'API

### Via Swagger UI

1. Ouvrir http://localhost:8000/docs
2. Tester les endpoints directement dans l'interface
3. Authentification : utiliser `/auth/register` puis `/auth/login`

### Via curl

```bash
# Test de santé
curl http://localhost:8000/docs

# Inscription
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User","role":"jobseeker"}'

# Connexion
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## Checklist de Démarrage

- [ ] Docker Desktop installé et lancé
- [ ] Projet cloné : `git clone https://github.com/CocoGenez/RecSys-Project-FairMatch.git`
- [ ] Backend démarré : `docker-compose up -d`
- [ ] Backend accessible : http://localhost:8000/docs
- [ ] Dépendances frontend installées : `npm install`
- [ ] Frontend démarré : `npm run dev`
- [ ] Frontend accessible : http://localhost:3000
- [ ] Test inscription/connexion OK

---

## Ressources

- Documentation FastAPI : https://fastapi.tiangolo.com/
- Documentation Docker : https://docs.docker.com/
- Documentation PostgreSQL : https://www.postgresql.org/docs/
