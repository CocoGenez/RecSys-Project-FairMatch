#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying FairMatch Backend${NC}"
echo ""

# 1. Clean the old folder if it exists
if [ -d ~/RecSys-Project-FairMatch ]; then
    echo -e "${YELLOW}⚙️  Removing old folder...${NC}"
    rm -rf ~/RecSys-Project-FairMatch
fi

# 2. Clone the repository
echo -e "${YELLOW}⚙️  Cloning repository...${NC}"
git clone https://github.com/CocoGenez/RecSys-Project-FairMatch.git
cd RecSys-Project-FairMatch
git checkout main

echo -e "${GREEN}✅ Repository cloned${NC}"

# 3. Check the .env file
echo ""
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating...${NC}"
    cat > backend/.env << 'ENVFILE'
DATABASE_URL=postgresql://fairmatch_admin:fairmatch_admin_password@fairmatch-db.c418ksio6pdy.us-east-1.rds.amazonaws.com:5432/postgres
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
API_HOST=0.0.0.0
API_PORT=8000
ENVFILE
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit backend/.env and replace YOUR_GOOGLE_API_KEY_HERE with your actual key!${NC}"
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

# 4. Start the backend
echo ""
echo -e "${YELLOW}⚙️  Starting backend with Docker Compose...${NC}"
docker compose down 2>/dev/null || true
docker compose up -d backend --build

# 5. Wait for startup
echo ""
echo -e "${YELLOW}⏳ Waiting for backend startup (10 seconds)...${NC}"
sleep 10

# 6. Verify logs
echo ""
echo -e "${GREEN}📋 Backend logs:${NC}"
docker compose logs --tail=20 backend

# 7. Health test
echo ""
echo -e "${YELLOW}🏥 Testing API health...${NC}"
if curl -s http://localhost:8000/ | grep -q "ok"; then
    echo -e "${GREEN}✅ API is running correctly!${NC}"
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ Deployment successful!                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}⚠️  API is not responding yet. Check the logs.${NC}"
fi

echo ""
echo -e "${YELLOW}📊 Container status:${NC}"
docker ps

echo ""
echo -e "${YELLOW}🔧 Useful commands:${NC}"
echo "  Real-time logs: docker compose logs -f backend"
echo "  Restart:        docker compose restart backend"
echo "  Stop:           docker compose down"
