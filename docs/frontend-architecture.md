# Frontend Architecture

TaskFlow's frontend is a high-performance **Single Page Application (SPA)** built with modern web technologies, designed for a responsive and collaborative user experience.

## 🚀 Core Stack
- **Framework**: [React 18.3](https://react.dev/) with [Vite](https://vitejs.dev/) for fast development and optimized builds.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) for a utility-first, maintainable design system.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for a lightweight, modular global store.
- **Real-time**: [Socket.IO Client](https://socket.io/) for persistent WebSocket communication.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth micro-interactions.
- **Components**: [Radix UI](https://www.radix-ui.com/) for headless, accessible UI primitives.

## 🏗️ Design Patterns

### 1. Store-Driven UI
The application state is managed by a centralized Zustand store (`src/app/store/useStore.ts`). This store is the "single source of truth" for:
- **Project Data**: Boards, Lists, and Tasks.
- **Authentication**: Current user sessions and permissions.
- **UI State**: Panel visibility, sidebar states, and loading indicators.
- **Real-time Presence**: Tracking which users are online and active in shared boards.

### 2. Optimistic UI Strategy
To ensure a "lag-free" experience, TaskFlow uses optimistic updates for all primary actions:
- **Action**: A user moves a task or updates a title.
- **Immediate Update**: The frontend store updates its local state instantly.
- **Background Sync**: An API call is sent to the backend.
- **Reconciliation**: 
    - On **success**, the store updates the temporary ID with the real database ID.
    - On **failure**, the store performs a **rollback**, reverts the change, and notifies the user via an error toast.

### 3. Component Hierarchy
- **Layouts**: Permanent shells (Sidebar, Topbar) that persist across views.
- **Containers/Views**: High-level components (BoardView, Dashboard) that connect to the Zustand store.
- **UI Components**: Atomic, reusable components (Button, Input, Badge) found in `src/app/components/ui`.

## 🔄 Real-time Integration
The frontend maintains a persistent WebSocket connection. It listens for server-side events (e.g., `task:moved`, `comment:added`) and applies granular patches to the local Zustand store. This creates a "multiplayer" feel where board changes are visible to all members without page refreshes.

---
*Back to [README.md](../README.md)*
