# API Contract Design

TaskFlow's API is built on RESTful principles, using consistent JSON structures for responses and strict schema validation for requests.

## 📡 Protocol Basics
- **Base URL**: `http://localhost:5000/api`
- **Content Type**: `application/json`
- **Authentication**: JWT Bearer token in the `Authorization` header.

## 📥 Request Validation
All endpoints use **Zod** to validate incoming data. If a request fails validation (e.g., missing title, invalid email), the server returns a `400 Bad Request` with a detailed error message.

## 📤 Response Envelope
To ensure consistency across the frontend, every API response follows this structure:

### Success Response
```json
{
  "success": true,
  "data": {
    "task": { "id": "uuid", "title": "Buy groceries", ... }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Title is required",
  "stack": "..." (Optional, only in development mode)
}
```

## 🛠️ Key API Modules

### 1. Authentication (`/auth`)
- `POST /signup`: Creates a new user.
- `POST /login`: Receives credentials, returns a JWT.
- `GET /me`: Returns the current user's profile.

### 2. Boards (`/boards`)
- `GET /`: Lists reachable boards.
- `POST /`: Creates a board and assigns the creator as "owner".
- `GET /:id`: Fetches a full board graph (metadata + lists + tasks).

### 3. Lists (`/lists`)
- `GET /boards/:id/lists`: Lists board columns.
- `POST /boards/:id/lists`: Adds a column to a board.

### 4. Tasks (`/tasks`)
- `POST /lists/:id/tasks`: Adds a task to a specific list.
- `PUT /:id/move`: Special endpoint for cross-list drag-and-drop.
- `POST /:id/assign`: Adds user assignments.

---
*Back to [README.md](../README.md)*
