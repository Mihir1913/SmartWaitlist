#!/bin/bash
# Smart Waitlist - Start all services (cross-platform)
# Usage: bash run.sh

# Get the directory where this script lives
PROJECT="$(cd "$(dirname "$0")" && pwd)"

# ── 1. Check / Start MongoDB ──────────────────────────────────
if pgrep -x mongod > /dev/null 2>&1; then
  echo "[1/3] MongoDB already running"
else
  # Try common mongod locations
  MONGO_CMD=""
  if command -v mongod &> /dev/null; then
    MONGO_CMD="mongod"
  elif [ -x "/opt/homebrew/bin/mongod" ]; then
    MONGO_CMD="/opt/homebrew/bin/mongod"
  elif [ -x "/usr/local/bin/mongod" ]; then
    MONGO_CMD="/usr/local/bin/mongod"
  elif [ -x "/tmp/mongodb-linux-x86_64-debian12-7.0.15/bin/mongod" ]; then
    MONGO_CMD="/tmp/mongodb-linux-x86_64-debian12-7.0.15/bin/mongod"
  fi

  if [ -z "$MONGO_CMD" ]; then
    echo ""
    echo "  ERROR: MongoDB not found!"
    echo ""
    echo "  Install it on Mac:"
    echo "    brew tap mongodb/brew"
    echo "    brew install mongodb-community"
    echo "    brew services start mongodb-community"
    echo ""
    echo "  Then re-run: bash run.sh"
    echo ""
    exit 1
  fi

  echo "[1/3] Starting MongoDB..."
  mkdir -p "$PROJECT/.mongodb-data"
  $MONGO_CMD --dbpath "$PROJECT/.mongodb-data" --port 27017 --fork --logpath "$PROJECT/.mongodb-data/mongod.log" 2>/dev/null
  sleep 2
  echo "  MongoDB started on port 27017"
fi

# ── 2. Seed Database ──────────────────────────────────────────
echo "[2/4] Seeding database..."
cd "$PROJECT/backend"
npx tsx src/seed.ts 2>&1 | tail -1

# ── 3. Start Backend ──────────────────────────────────────────
echo "[3/4] Starting backend on port 3001..."
cd "$PROJECT/backend"
npx tsx src/index.ts &
BACKEND_PID=$!

for i in $(seq 1 15); do
  if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    echo "  Backend ready (PID: $BACKEND_PID)"
    break
  fi
  sleep 1
done

# ── 4. Start Frontend ─────────────────────────────────────────
echo "[4/4] Starting frontend on port 5173..."
cd "$PROJECT/frontend"
npx vite --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!
sleep 2
echo "  Frontend ready (PID: $FRONTEND_PID)"

echo ""
echo "=================================================="
echo "  Smart Waitlist is LIVE"
echo "=================================================="
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:3001"
echo ""
echo "  Owner:   owner@spicegarden.com  (password123)"
echo "  Staff:   staff@spicegarden.com   (password123)"
echo "  Kitchen: kitchen@spicegarden.com  (password123)"
echo ""
echo "  Customer: http://localhost:5173/join/spice-garden"
echo "=================================================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'" EXIT INT TERM

wait
