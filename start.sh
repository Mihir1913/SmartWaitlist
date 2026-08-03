#!/bin/bash
# Smart Waitlist - Start Script
# ================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Smart Waitlist - Starting Servers${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. Check MongoDB
echo -e "${YELLOW}[1/4] Checking MongoDB...${NC}"
if pgrep -f mongod > /dev/null 2>&1; then
  echo -e "${GREEN}  MongoDB is running${NC}"
else
  echo -e "${YELLOW}  Starting MongoDB...${NC}"
  mkdir -p /home/z/mongodb-data
  /tmp/mongodb-linux-x86_64-debian12-7.0.15/bin/mongod --dbpath /home/z/mongodb-data --port 27017 --fork --logpath /home/z/mongodb-data/mongod.log
fi

# 2. Seed database (if needed)
echo -e "${YELLOW}[2/4] Seeding database...${NC}"
cd "$PROJECT_DIR/backend" && npx tsx src/seed.ts 2>&1 | tail -3

# 3. Start Backend
echo -e "${YELLOW}[3/4] Starting Backend (port 3001)...${NC}"
cd "$PROJECT_DIR/backend"
nohup npx tsx src/index.ts > /tmp/smart-waitlist-backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/smart-waitlist-backend.pid
sleep 3

if curl -s http://127.0.0.1:3001/health > /dev/null 2>&1; then
  echo -e "${GREEN}  Backend started (PID: $BACKEND_PID)${NC}"
else
  echo -e "${YELLOW}  Backend may still be starting... Check /tmp/smart-waitlist-backend.log${NC}"
fi

# 4. Start Frontend
echo -e "${YELLOW}[4/4] Starting Frontend (port 5173)...${NC}"
cd "$PROJECT_DIR/frontend"
nohup npx vite --host 0.0.0.0 > /tmp/smart-waitlist-frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/smart-waitlist-frontend.pid
sleep 3

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Smart Waitlist is RUNNING!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Frontend:  ${BLUE}http://localhost:5173${NC}"
echo -e "  Backend:   ${BLUE}http://localhost:3001${NC}"
echo -e "  Health:    ${BLUE}http://localhost:3001/health${NC}"
echo ""
echo -e "  ${YELLOW}Demo Login Credentials (password: password123):${NC}"
echo -e "    Owner:   owner@spicegarden.com  -> /admin"
echo -e "    Staff:   staff@spicegarden.com   -> /staff"
echo -e "    Kitchen: kitchen@spicegarden.com -> /kitchen"
echo ""
echo -e "  ${YELLOW}Customer Flow:${NC}"
echo -e "    Join:    http://localhost:5173/join/spice-garden"
echo ""
echo -e "  To stop:  ${YELLOW}pkill -f 'tsx src/index'; pkill -f 'vite'${NC}"
echo ""

# Keep script running to maintain child processes
wait