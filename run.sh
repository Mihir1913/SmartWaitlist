#!/bin/bash
set -euo pipefail

# Smart Waitlist - Start all services (cross-platform)
# Usage: bash run.sh

# Get the directory where this script lives
PROJECT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  echo "Servers stopped."
}
trap cleanup EXIT INT TERM

start_mongodb() {
  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:27017 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[1/3] MongoDB already listening on port 27017"
    return 0
  fi

  if pgrep -x mongod > /dev/null 2>&1; then
    echo "[1/3] MongoDB already running"
    return 0
  fi

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
  if ! "$MONGO_CMD" --dbpath "$PROJECT/.mongodb-data" --port 27017 --fork --logpath "$PROJECT/.mongodb-data/mongod.log" 2>/dev/null; then
    echo "  Failed to start MongoDB."
    exit 1
  fi

  sleep 2
  if ! pgrep -x mongod > /dev/null 2>&1; then
    echo "  MongoDB failed to start."
    exit 1
  fi

  echo "  MongoDB started on port 27017"
}

ensure_dependencies() {
  if [ ! -d "$PROJECT/backend/node_modules" ] || [ ! -d "$PROJECT/frontend/node_modules" ]; then
    echo "[2/4] Installing dependencies..."
    npm install --prefix "$PROJECT/backend"
    npm install --prefix "$PROJECT/frontend"
  fi
}

seed_database() {
  echo "[2/4] Seeding database..."
  cd "$PROJECT/backend"
  if [ -x "$PROJECT/backend/node_modules/.bin/tsx" ]; then
    "$PROJECT/backend/node_modules/.bin/tsx" src/seed.ts
  else
    npx --yes tsx src/seed.ts
  fi
}

start_backend() {
  echo "[3/4] Starting backend on port 3001..."
  cd "$PROJECT/backend"
  if [ -x "$PROJECT/backend/node_modules/.bin/tsx" ]; then
    "$PROJECT/backend/node_modules/.bin/tsx" src/index.ts &
  else
    npx --yes tsx src/index.ts &
  fi
  BACKEND_PID=$!

  for i in $(seq 1 20); do
    if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
      echo "  Backend ready (PID: $BACKEND_PID)"
      return 0
    fi

    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo "  Backend failed to start."
      exit 1
    fi
    sleep 1
  done

  echo "  Backend did not become ready in time."
  exit 1
}

start_frontend() {
  echo "[4/4] Starting frontend on port 5173..."
  cd "$PROJECT/frontend"
  if [ -x "$PROJECT/frontend/node_modules/.bin/vite" ]; then
    "$PROJECT/frontend/node_modules/.bin/vite" --host 0.0.0.0 --port 5173 &
  else
    npx --yes vite --host 0.0.0.0 --port 5173 &
  fi
  FRONTEND_PID=$!

  for i in $(seq 1 20); do
    if curl -sf http://localhost:5173 > /dev/null 2>&1; then
      echo "  Frontend ready (PID: $FRONTEND_PID)"
      return 0
    fi

    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      echo "  Frontend failed to start."
      exit 1
    fi
    sleep 1
  done

  echo "  Frontend did not become ready in time."
  exit 1
}

start_mongodb
ensure_dependencies
seed_database
start_backend
start_frontend

echo ""
echo "=================================================="
echo "  Smart Waitlist is LIVE"
echo "=================================================="
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:3001"
echo ""
echo "  SuperAdmin: admin@smartwaitlist.com (IQ_SmartWaitList\$2026@)"
echo "  Create your own custom restaurants directly from the SuperAdmin portal."
echo "=================================================="

wait "$BACKEND_PID" "$FRONTEND_PID"
