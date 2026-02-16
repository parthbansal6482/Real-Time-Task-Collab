# Backend Architecture

TaskFlow's backend is a stateless **Node.js REST API** designed for security, scalability, and real-time event broadcasting.

## 🚀 Core Stack
- **Runtime**: Node.js 20+ with TypeScript (strict mode).
- **Framework**: [Express.js](https://expressjs.com/) for routing and middleware.
- **Database**: [PostgreSQL](https://www.postgresql.org/) for persistent storage.
- **ORM**: [Prisma](https://www.prisma.io/) for type-safe database access and migrations.
- **Auth**: [JSON Web Tokens (JWT)](https://jwt.io/) and `bcryptjs` for encryption.
- **Real-time**: [Socket.IO](https://socket.io/) for event broadcasting.
- **Validation**: [Zod](https://zod.dev/) for runtime request schema validation.

## 🏗️ Architectural Patterns

### 1. Layered Service-Controller Pattern
The backend is structured into three distinct layers to ensure separation of concerns:
- **Routes Layer**: Defines the API endpoints and connects them to middlewares/controllers.
- **Controller Layer**: Handles HTTP-level details. Parses headers, query params, and request bodies. It delegates business logic to services and returns standard JSON responses.
- **Service Layer**: The "brains" of the application. Contains all business logic, database queries (via Prisma), and permission checks. Services are independent of the web framework (Express).

### 2. Middleware Pipeline
Every request passes through a standardized security and validation pipeline:
1.  **Authentication**: Verifies JWT and attaches the `userId` to the request object.
2.  **Schema Validation**: Uses Zod to ensure the request body and params match the expected types and constraints.
3.  **Access Control**: A specialized `requireBoardAccess` middleware ensures the user is a member of the specific board being accessed (lists, tasks, members).

### 3. Event-Driven Broadcasting
The backend uses an internal event system to keep clients in sync. When a service modifies the database (e.g., `taskService.moveTask`):
1.  The database change is committed.
2.  The service layer triggers the Socket.IO handler.
3.  The server broadcasts the update to all clients joined in the room for that `boardId`.

## 📂 Project Structure (backend/src)
- `config/`: Configuration for Database, Env, and Socket.IO.
- `controllers/`: Request handlers.
- `middlewares/`: Security, validation, and error handling.
- `routes/`: API endpoint definitions.
- `services/`: Core business logic and database operations.
- `socket/`: Socket.IO event handlers and rooms.
- `utils/`: Helpers and customized `ApiError` class.

---
*Back to [README.md](../README.md)*
