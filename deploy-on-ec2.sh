#!/bin/bash
# Script à exécuter sur l'EC2 pour déployer le backend

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Déploiement du Backend FairMatch${NC}"
echo ""

# 1. Nettoyer l'ancien dossier si existe
echo -e "${YELLOW}⚙️  Nettoyage et préparation...${NC}"
cd ~
if [ -d ~/RecSys-Project-FairMatch ]; then
    echo -e "${YELLOW}⚙️  Suppression de l'ancien dossier...${NC}"
    rm -rf ~/RecSys-Project-FairMatch
fi

# 2. Cloner le repository
echo -e "${YELLOW}⚙️  Clonage du repository...${NC}"
git clone https://github.com/CocoGenez/RecSys-Project-FairMatch.git
cd RecSys-Project-FairMatch
git checkout Paul

echo -e "${GREEN}✅ Repository cloné${NC}"

# 3. Vérifier le fichier .env
echo ""
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}⚠️  Fichier .env non trouvé. Création...${NC}"
    cat > backend/.env << 'ENVFILE'
DATABASE_URL=postgresql://fairmatch_admin:fairmatch_admin_password@fairmatch-db.c418ksio6pdy.us-east-1.rds.amazonaws.com:5432/postgres
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
API_HOST=0.0.0.0
API_PORT=8000
ENVFILE
    echo -e "${YELLOW}⚠️  IMPORTANT: Modifiez backend/.env et remplacez YOUR_GOOGLE_API_KEY_HERE par votre vraie clé !${NC}"
else
    echo -e "${GREEN}✅ Fichier .env trouvé${NC}"
fi

# 4. Lancer le backend
echo ""
echo -e "${YELLOW}⚙️  Lancement du backend avec Docker Compose...${NC}"
docker compose down 2>/dev/null || true
docker compose up -d backend --build

# 5. Attendre le démarrage
echo ""
echo -e "${YELLOW}⏳ Attente du démarrage du backend (10 secondes)...${NC}"
sleep 10

# 6. Vérifier les logs
echo ""
echo -e "${GREEN}📋 Logs du backend:${NC}"
docker compose logs --tail=20 backend

# 7. Test de santé
echo ""
echo -e "${YELLOW}🏥 Test de santé de l'API...${NC}"
if curl -s http://localhost:8000/ | grep -q "ok"; then
    echo -e "${GREEN}✅ API fonctionne correctement !${NC}"
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ Déploiement réussi!                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}⚠️  L'API ne répond pas encore. Vérifiez les logs.${NC}"
fi

echo ""
echo -e "${YELLOW}📊 État des conteneurs:${NC}"
docker ps

echo ""
echo -e "${YELLOW}🔧 Commandes utiles:${NC}"
echo "  Logs en temps réel: docker compose logs -f backend"
echo "  Redémarrer:         docker compose restart backend"
echo "  Arrêter:            docker compose down"
