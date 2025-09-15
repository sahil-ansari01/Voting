# Voting

## Real-Time Polling API

Backend service implementing REST + WebSocket real-time updates for a polling app.

### Stack
- Node.js + Express
- PostgreSQL + Prisma ORM
- Socket.IO for real-time
- TypeScript

### Prerequisites
- Node 18+
- Docker Desktop (for local Postgres) or an external PostgreSQL instance

### Setup
1. Clone and install
```
git clone <repo>
cd Voting
npm install
```

2. Environment
```
copy .env .env.example
# or edit .env and set DATABASE_URL if not using defaults
```

3. Prisma
```
npx prisma generate
npx prisma migrate dev --name init
```
Note: Prisma client is generated to `generated/prisma/` directory

4. Run
```
npm run dev
# or
npm run build && npm start

## Client App (Next.js)

The frontend lives in `client/` and is a Next.js app.

1) Install dependencies
```
cd client
npm install
```

2) Environment
```
# Create client/.env.local and set the API base URL
NEXT_PUBLIC_API_URL=http://localhost:5000
```

3) Start the client
```
# In one terminal (root):
npm run dev   # starts the API at http://localhost:5000

# In another terminal (client/):
npm run dev   # starts Next.js at http://localhost:3000
```

Build and run production
```
# API (root)
npm run build && npm start

# Client (client/)
npm run build && npm start
```

Notes
- The client reads the API base URL from `NEXT_PUBLIC_API_URL`.
- Default ports: API `5000`, Client `3000`.

### Project Structure
```
.
├─ src/
│  ├─ app.ts                 # Express + Socket.IO server entry (builds to dist/app.js)
│  ├─ config/
│  │  └─ prisma.ts           # Prisma client singleton
│  ├─ controllers/
│  │  ├─ users.ts            # User handlers
│  │  ├─ polls.ts            # Poll handlers
│  │  └─ votes.ts            # Vote handlers + broadcasting
│  ├─ middleware/
│  │  └─ errorHandler.ts     # Centralized error handling
│  └─ routes/
│     ├─ users.ts            # /api/users
│     ├─ polls.ts            # /api/polls
│     └─ votes.ts            # /api/votes
├─ prisma/
│  ├─ migrations/            # Prisma migrations
│  └─ schema.prisma          # Prisma schema
├─ generated/
│  └─ prisma/                # Generated Prisma client (output target)
├─ client/                   # Next.js frontend
│  ├─ app/                   # App Router pages/layout
│  ├─ components/            # UI components
│  ├─ hooks/                 # React hooks
│  ├─ lib/                   # Client utilities (API wrapper, helpers)
│  ├─ public/                # Static assets
│  ├─ styles/                # Global styles
│  ├─ next.config.mjs
│  ├─ package.json
│  └─ tsconfig.json
├─ .env                      # Backend environment (DATABASE_URL, PORT, JWT_SECRET)
├─ package.json              # Backend scripts (dev/build/start)
└─ README.md
```

### API Endpoints
- POST `/api/users` { name, email, password }
- GET `/api/users`
- POST `/api/polls` { creatorId, question, options: string[], isPublished? }
- GET `/api/polls`
- GET `/api/polls/:id`
- POST `/api/votes` { userId, pollOptionId }

### WebSocket Events
- Client joins a poll room: `join_poll` with pollId
- Server broadcasts results on: `poll_results` with `{ pollId, options: [{ id, text, votes }] }`

### Testing with curl
```
# Create user
curl -X POST http://localhost:5000/api/users \
 -H "Content-Type: application/json" \
 -d '{"name":"Alice","email":"alice@example.com","password":"pass"}'

# Create poll
curl -X POST http://localhost:5000/api/polls \
 -H "Content-Type: application/json" \
 -d '{"creatorId":"<USER_ID>","question":"Best JS runtime?","options":["Node","Deno"]}'

# Vote
curl -X POST http://localhost:5000/api/votes \
 -H "Content-Type: application/json" \
 -d '{"userId":"<USER_ID>","pollOptionId":"<OPTION_ID>"}'
```

### Notes
- Update `DATABASE_URL` in `.env` for your Postgres.
- Server runs from `app.ts` (compiled to `dist/app.js`).
- Adheres to Task.txt requirements: REST CRUD, Prisma relations, and live results via WebSocket.