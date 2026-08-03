<div align="center">

# SmartWaitlist

### WhatsApp-Native Restaurant Queue Management SaaS

<img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/MongoDB-8.0-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
<img src="https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socket.io&logoColor=white" alt="Socket.IO" />
<img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />

Customers join waitlists via WhatsApp link. Staff manage queues, tables, and orders in real-time. Kitchen tracks orders live. Owners get analytics at a glance.

</div>

---

## Features

### Customer
- Join restaurant waitlist via shareable WhatsApp link (e.g., `yoursite.com/join/spice-garden`)
- Enter name, phone, and party size — instant queue confirmation
- Real-time status updates via Socket.io (no page refresh needed)
- Check queue position and estimated wait time

### Staff
- View and manage the live customer queue
- Notify customers when their table is ready (WhatsApp stub integration)
- Seat customers and assign tables automatically by party size
- Create and manage orders for seated customers
- Track table availability at a glance

### Kitchen
- Live order display — new orders appear instantly
- Update order status: `New` > `Preparing` > `Ready`
- Real-time sync — staff sees status changes immediately

### Owner / Admin
- Dashboard with key metrics: total customers, average wait time, table utilization, revenue
- Analytics charts for wait time trends and peak hours
- Restaurant settings management
- Multi-role access control (Owner, Staff, Kitchen)

### Technical
- **Real-time** everywhere via Socket.io (cross-panel instant updates)
- **JWT authentication** with role-based access control
- **WhatsApp Business API** ready (stub service included, easy to swap for real API)
- **Zod validation** on all API endpoints
- **Rate limiting** and **Helmet** security headers
- **Responsive** Tailwind CSS design

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS 3 |
| State & Data | TanStack Query v5, Zustand, Socket.io Client |
| Backend | Node.js, Express 4, TypeScript |
| Database | MongoDB 8 (Mongoose ODM) |
| Real-time | Socket.io |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod |
| Security | Helmet, express-rate-limit, CORS |

---

## Project Structure

```
SmartWaitlist/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, env config
│   │   ├── middleware/       # JWT auth middleware
│   │   ├── models/          # Mongoose schemas (User, Restaurant, Table, QueueEntry, Order, Menu)
│   │   ├── routes/          # Express routes (auth, queue, tables, orders, kitchen, analytics, whatsapp)
│   │   ├── services/        # Business logic (queue, table, order, analytics, whatsapp, socket)
│   │   ├── types/           # TypeScript type definitions
│   │   ├── seed.ts          # Database seeder with sample data
│   │   └── index.ts         # Express server entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── context/         # Auth context provider
│   │   ├── hooks/           # Custom hooks (useSocket)
│   │   ├── lib/             # API client (axios)
│   │   ├── pages/           # All page components
│   │   └── types/           # Shared TypeScript types
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── run.sh                 # One-command start script
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

- **Node.js** >= 18
- **MongoDB** >= 6.0 (running locally or via Docker)
- **npm** >= 9

### Install MongoDB on macOS

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Mihir1913/SmartWaitlist.git
cd SmartWaitlist
```

### 2. Install dependencies

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 3. Start everything (one command)

```bash
bash run.sh
```

This script automatically:
- Checks/starts MongoDB
- Seeds the database with sample data
- Starts the backend on port **3001**
- Starts the frontend on port **5173**

Open **http://localhost:5173** in your browser.

### 4. Stop the servers

Press **`Ctrl + C`** in the terminal. Do NOT use `Ctrl + Z` (that only suspends).

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Owner** | owner@spicegarden.com | password123 |
| **Staff** | staff@spicegarden.com | password123 |
| **Kitchen** | kitchen@spicegarden.com | password123 |

| View | URL |
|------|-----|
| **Customer Join Page** | http://localhost:5173/join/spice-garden |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email & password |
| GET | `/api/auth/me` | Get current user profile |

### Queue
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants/:id/queue` | Get all queue entries |
| POST | `/api/restaurants/:id/queue` | Join the waitlist |
| PATCH | `/api/restaurants/:id/queue/:entryId/notify` | Notify a customer |
| PATCH | `/api/restaurants/:id/queue/:entryId/seat` | Seat a customer |
| DELETE | `/api/restaurants/:id/queue/:entryId` | Remove from queue |

### Tables
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants/:id/tables` | List all tables |
| POST | `/api/restaurants/:id/tables` | Create a table |
| PATCH | `/api/restaurants/:id/tables/:tableId` | Update table status |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants/:id/orders` | List orders |
| POST | `/api/restaurants/:id/orders` | Create a new order |
| PATCH | `/api/restaurants/:id/orders/:orderId/status` | Update order status |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants/:id/analytics/dashboard` | Dashboard stats & metrics |

---

## Real-Time Events (Socket.io)

| Event | Triggered When |
|-------|---------------|
| `queue:updated` | Customer joins, is notified, or is seated |
| `table:updated` | Table status changes (available/occupied) |
| `order:updated` | Order is created or status changes |
| `order:new` | New order sent to kitchen |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and update:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/smart-waitlist
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:5173
WHATSAPP_PHONE=919876543210
```

---

## Docker (Alternative)

```bash
docker-compose up -d
```

---

## License

MIT
