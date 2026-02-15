# TaskFlow — Real-Time Task Collaboration Backend

A production-ready REST API with WebSocket real-time capabilities for a Trello-like task collaboration platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ / TypeScript (strict) |
| Framework | Express.js |
| Database | PostgreSQL 14+ |
| ORM | Prisma |
| Auth | JWT + bcryptjs |
| Real-time | Socket.IO |
| Validation | Zod |
| Testing | Jest + Supertest |

## Quick Start

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14 (running on `localhost:5432`)
- A database called `taskflow`

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL connection string
```

### 3. Set Up Database

```bash
npx prisma migrate dev --name init   # Create tables
npx prisma db seed                    # Seed demo data
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on **http://localhost:5000**

### Demo Credentials

| Email | Password |
|---|---|
| `demo@example.com` | `Demo@123` |
| `alex@example.com` | `Demo@123` |

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout (invalidate token) |
| GET | `/api/auth/me` | Get authenticated user profile |

### Boards

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards` | List user's boards (paginated) |
| POST | `/api/boards` | Create a new board |
| GET | `/api/boards/:boardId` | Get board with lists, tasks, members |
| PUT | `/api/boards/:boardId` | Update board name/description |
| DELETE | `/api/boards/:boardId` | Delete board |

### Board Members

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards/:boardId/members` | Get board members |
| POST | `/api/boards/:boardId/members` | Add member to board |
| DELETE | `/api/boards/:boardId/members/:userId` | Remove member |

### Lists

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards/:boardId/lists` | Get lists in a board |
| POST | `/api/boards/:boardId/lists` | Create a new list |
| PUT | `/api/lists/:listId` | Update list name/position |
| DELETE | `/api/lists/:listId` | Delete a list |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/lists/:listId/tasks` | Get tasks in a list (paginated) |
| POST | `/api/lists/:listId/tasks` | Create a task in a list |
| GET | `/api/tasks/:taskId` | Get task details |
| PUT | `/api/tasks/:taskId` | Update task fields |
| DELETE | `/api/tasks/:taskId` | Delete a task |
| PUT | `/api/tasks/:taskId/move` | Move task to another list |
| POST | `/api/tasks/:taskId/assign` | Assign user to task |
| DELETE | `/api/tasks/:taskId/assign/:userId` | Unassign user |

### Activities

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards/:boardId/activities` | Get activity log (paginated) |

### Search

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards/search?q=` | Search boards by name |
| GET | `/api/boards/:boardId/search?q=` | Search tasks in board |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Server health status |

---

## WebSocket Events

Connect with `socket.io-client` passing `{ auth: { token } }`:

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join:board` | `{ boardId }` | Join a board room |
| `leave:board` | `{ boardId }` | Leave a board room |
| `user:editing` | `{ taskId, boardId }` | Signal editing a task |
| `user:stopped_editing` | `{ taskId, boardId }` | Signal stopped editing |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `task:created` | `{ task }` | New task created |
| `task:updated` | `{ task }` | Task fields changed |
| `task:deleted` | `{ taskId, listId }` | Task deleted |
| `task:moved` | `{ taskId, oldListId, newListId, task }` | Task moved |
| `task:assigned` | `{ taskId, userId, assignment }` | User assigned |
| `task:unassigned` | `{ taskId, userId }` | User unassigned |
| `list:created` | `{ list }` | New list created |
| `list:updated` | `{ list }` | List renamed/moved |
| `list:deleted` | `{ listId, boardId }` | List deleted |
| `board:updated` | `{ board }` | Board settings changed |
| `board:deleted` | `{ boardId }` | Board deleted |
| `member:added` | `{ member, boardId }` | Member joined board |
| `member:removed` | `{ userId, boardId }` | Member left board |
| `user:joined` | `{ userId, username, boardId }` | User came online in board |
| `user:left` | `{ userId, boardId }` | User went offline in board |
| `board:presence` | `{ boardId, users }` | Current online users |

---

## Project Structure

```
backend/
├── src/
│   ├── config/           # Database, env, socket setup
│   ├── controllers/      # Request handlers (thin layer)
│   ├── middlewares/       # Auth, validation, error handling, board access
│   ├── routes/           # Express route definitions
│   ├── services/         # Business logic layer
│   ├── socket/           # WebSocket event handlers
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Helpers, error class, response wrapper
│   ├── app.ts            # Express app configuration
│   └── server.ts         # HTTP server + socket entry point
├── prisma/
│   ├── schema.prisma     # Database schema (7 models)
│   └── seed.ts           # Demo data seeder
├── tests/
│   ├── integration/      # API endpoint tests
│   └── setup.ts          # Test utilities
└── .env.example
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:seed` | Seed demo data |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
