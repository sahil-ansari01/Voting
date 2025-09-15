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

4. Run
```
npm run dev
# or
npm run build && npm start

### Project Structure
```
src/
  app.ts                 # Express + Socket.IO server entry (builds to dist/app.js)
  config/
    prisma.ts            # Prisma client singleton
  controllers/
    users.controller.ts  # User handlers
    polls.controller.ts  # Poll handlers
    votes.controller.ts  # Vote handlers + broadcasting
  middleware/
    errorHandler.ts      # Centralized error handling
  routes/
    users.ts             # /api/users
    polls.ts             # /api/polls
    votes.ts             # /api/votes
```
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
curl -X POST http://localhost:4000/api/users \
 -H "Content-Type: application/json" \
 -d '{"name":"Alice","email":"alice@example.com","password":"pass"}'

# Create poll
curl -X POST http://localhost:4000/api/polls \
 -H "Content-Type: application/json" \
 -d '{"creatorId":"<USER_ID>","question":"Best JS runtime?","options":["Node","Deno"]}'

# Vote
curl -X POST http://localhost:4000/api/votes \
 -H "Content-Type: application/json" \
 -d '{"userId":"<USER_ID>","pollOptionId":"<OPTION_ID>"}'
```

### Notes
- Update `DATABASE_URL` in `.env` for your Postgres.
- Server runs from `app.ts` (compiled to `dist/app.js`).
- Adheres to Task.txt requirements: REST CRUD, Prisma relations, and live results via WebSocket.