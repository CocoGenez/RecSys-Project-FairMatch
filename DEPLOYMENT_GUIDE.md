# 🚀 Guide de Déploiement - FairMatch

## 📊 Architecture du Système

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

### Composants

- **Frontend (Next.js)** : Interface utilisateur, actuellement en local `http://localhost:3000`
- **Backend (FastAPI)** : API REST sur EC2 AWS `http://13.221.63.255:8000`
- **Base de données (PostgreSQL)** : Sur AWS RDS
- **ML Service** : En local pour le moment (à déployer ultérieurement)

---

## 🎯 Prérequis

- Node.js 18+ et npm installés
- Docker et Docker Compose installés (pour développement local)
- Accès au repository GitHub
- Variables d'environnement (demander au chef de projet)

---

## 📦 Installation et Déploiement

### 1️⃣ Cloner le Projet

```bash
git clone https://github.com/CocoGenez/RecSys-Project-FairMatch.git
cd RecSys-Project-FairMatch
git checkout Paul
```

### 2️⃣ Configuration Backend (déjà déployé sur EC2)

Le backend tourne déjà sur AWS EC2. Vous n'avez **rien à faire** pour le backend, il est accessible à :

```
http://13.221.63.255:8000
```

**Test de santé :**
```bash
curl http://13.221.63.255:8000/
# Réponse attendue : {"status":"ok","message":"FairMatch API is running","version":"1.0"}
```

**Documentation API (Swagger) :**
```
http://13.221.63.255:8000/docs
```

### 3️⃣ Lancer le Frontend en Local

#### Installer les dépendances

```bash
cd frontend
npm install
```

#### Configuration

Le fichier `frontend/lib/api.ts` est déjà configuré pour pointer vers l'EC2 :

```typescript
const API_URL = 'http://13.221.63.255:8000';
```

#### Démarrer le frontend

```bash
npm run dev
```

Le frontend sera accessible sur : `http://localhost:3000`

### 4️⃣ Tester l'Application

1. Ouvrez votre navigateur : `http://localhost:3000`
2. Créez un compte (Register)
3. Connectez-vous (Login)
4. Testez l'upload de CV
5. Testez le système de swipe

---

## 🔧 Développement Local (Backend)

Si vous voulez tester le backend en local (optionnel) :

### Prérequis
- Python 3.12+
- Docker et Docker Compose

### Variables d'environnement

Le fichier `backend/.env` est **déjà présent dans le repository** avec toutes les configurations nécessaires. Vous n'avez rien à configurer ! 🎉

### Lancer avec Docker

```bash
cd RecSys-Project-FairMatch
docker compose up backend
```

Le backend local sera sur `http://localhost:8000`

### Lancer sans Docker

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📁 Structure du Projet

```
RecSys-Project-FairMatch/
├── backend/                  # API FastAPI (Python)
│   ├── main.py              # Point d'entrée
│   ├── routers/             # Routes API
│   ├── lib/                 # Database, models, schemas
│   ├── models/              # ML models
│   ├── Processed/           # Données traitées
│   └── requirements.txt     # Dépendances Python
│
├── frontend/                # Application Next.js
│   ├── app/                 # Pages et layouts
│   ├── components/          # Composants React
│   ├── lib/                 # Utils et API clients
│   └── package.json         # Dépendances Node.js
│
├── backend-ml/              # Service ML (à déployer)
│   ├── app.py
│   └── requirements.txt
│
├── docker-compose.yml       # Configuration Docker
└── DEPLOYMENT_GUIDE.md      # Ce fichier
```

---

## 🌐 URLs Importantes

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | `http://localhost:3000` | Interface utilisateur |
| Backend API | `http://13.221.63.255:8000` | API REST (production) |
| API Docs | `http://13.221.63.255:8000/docs` | Documentation Swagger |
| Base de données | `fairmatch-db.c418ksio6pdy.us-east-1.rds.amazonaws.com:5432` | PostgreSQL RDS |

---

## 🔑 Endpoints API Principaux

### Authentication
- `POST /auth/register` - Créer un compte
- `POST /auth/login` - Se connecter
- `GET /auth/me` - Profil utilisateur

### Resume
- `POST /api/parse-resume` - Parser un CV (multipart/form-data)

### Recommendations
- `GET /recommend/{user_id}` - Obtenir des recommandations

### Interactions
- `POST /interactions/` - Enregistrer une interaction (like/dislike)
- `GET /interactions/user/{user_id}` - Historique d'un utilisateur

---

## 🐛 Dépannage

### Le frontend ne se lance pas

```bash
# Supprimer node_modules et réinstaller
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Erreur de connexion à l'API

1. Vérifiez que l'API EC2 est accessible :
   ```bash
   curl http://13.221.63.255:8000/
   ```

2. Vérifiez la configuration dans `frontend/lib/api.ts`

3. Vérifiez les logs du navigateur (Console DevTools)

### Erreur CORS

Le backend est configuré pour accepter toutes les origines en développement. Si vous avez des erreurs CORS, contactez le chef de projet.

---

## 🚀 Déploiement Backend (pour admins uniquement)

**Cette section est réservée au chef de projet.**

### Se connecter à l'EC2

```bash
ssh -i ~/.ssh/fairmatch-ec2-key.pem ubuntu@13.221.63.255
```

### Mettre à jour le code

```bash
cd ~/RecSys-Project-FairMatch
git pull origin Paul
docker compose up -d backend --build
```

### Voir les logs

```bash
docker compose logs -f backend
```

### Redémarrer le backend

```bash
docker compose restart backend
```

---

## 📝 TODO - Prochaines Étapes

- [ ] Déployer le frontend sur Vercel/Netlify
- [ ] Déployer le service ML sur une instance EC2 séparée
- [ ] Configurer un nom de domaine
- [ ] Ajouter HTTPS avec certificat SSL
- [ ] Mettre en place CI/CD avec GitHub Actions
- [ ] Ajouter monitoring et alertes

---

## 👥 Support

**Problèmes ou questions ?**
- Créer une issue sur GitHub
- Contacter le chef de projet : Paul Busetta

---

## 📄 Licence

Projet académique - ING5 RecSys

**Dernière mise à jour :** 2 décembre 2025
