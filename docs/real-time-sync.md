# Real-time Sync Strategy

TaskFlow provides a "multiplayer" experience where task moves, comments, and member actions are visible to all team members instantly. This is achieved through a robust WebSocket implementation.

## 🔌 Technology
We use **Socket.IO** (on both frontend and backend) for its reliable WebSocket abstraction, automatic re-connection, and room management capabilities.

## 🏗️ Room-Based Orchestration
Instead of broadcasting every event to every user, the server partitions users into **Rooms**:
1.  **Identity Room**: Each user joins a room named `user:${userId}` on connection. This is used for personal notifications.
2.  **Board Rooms**: When a user opens a board, they join `board:${boardId}`. All collaborative actions (e.g., `task:deleted`) are broadcast specifically to this board room.

## 🔄 Interaction Flow

### 1. The Action Cycle
- **Trigger**: A user performs an action (e.g., changes a task title).
- **Backend Service**: The request hits a REST API controller, which calls a service. The service commits the change to PostgreSQL (Prisma).
- **Emission**: Once the database transaction is successful, the service triggers a Socket.IO emission:
  ```typescript
  io.to(`board:${boardId}`).emit('task:updated', updatedTask);
  ```
- **Sync**: All other clients in the board room receive the `task:updated` event and patch their local **Zustand store** to reflect the change.

### 2. Presence & Indicators
The server monitors connection/disconnection events to keep a live list of active users in each board. This enables:
- **Online Badges**: Colored indicators in the avatars group showing who is currently viewing the board.
- **Activity Feed**: Real-time pulses in the sidebar showing recent team actions.

## ⚖️ Conflict Resolution
By using **Explicit Positions (integers)** instead of linked lists for task ordering, and processing all moves on the server, we maintain a robust order even if multiple users move tasks simultaneously. The server acts as the final arbiter of state.

---
*Back to [README.md](../README.md)*
