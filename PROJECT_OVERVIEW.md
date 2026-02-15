# TaskFlow - Real-Time Task Collaboration Platform

A modern Single Page Application (SPA) for real-time task collaboration, built as a Trello + Notion hybrid.

## 🚀 Tech Stack

- **React 18.3** with Vite
- **Tailwind CSS v4** for styling
- **Zustand** for state management
- **Socket.IO** for real-time updates (mock implementation)
- **React DnD** for drag-and-drop functionality
- **Motion** (Framer Motion) for animations
- **Lucide React** for icons
- **Radix UI** for accessible components
- **date-fns** for date formatting

## 📁 Project Structure

```
src/app/
├── components/
│   ├── activity/         # Real-time activity panel
│   ├── board/            # Kanban board view with drag-and-drop
│   ├── common/           # Reusable UI components
│   ├── dashboard/        # Dashboard with board grid
│   ├── layout/           # Main layout (Sidebar, Topbar)
│   ├── task/             # Task modal and components
│   └── ui/               # Base UI components (Radix)
├── hooks/                # Custom React hooks
├── services/             # External services (Socket.IO)
├── store/                # Zustand state management
└── App.tsx               # Main application entry
```

## 🎨 Key Features

### Single Page Architecture
- One persistent layout with dynamic content rendering
- No full-page reloads - state-driven UI updates
- Smooth transitions between views

### Dashboard View
- Grid display of all boards
- Create new boards with custom colors
- Quick access to recent activity
- Search functionality

### Board View (Kanban)
- Horizontal scrollable lists
- Drag-and-drop tasks between lists
- Create and edit lists inline
- Add tasks with quick-add functionality
- Real-time visual feedback

### Task Management
- Detailed task modal with:
  - Title and description editing
  - Assignee management
  - Due date picker
  - Activity history
  - Delete functionality

### Real-Time Collaboration
- Activity panel with live updates
- Online user indicators
- Visual feedback for task movements
- Mock Socket.IO connection for demo

### Responsive Design
- Desktop-first with full sidebar
- Tablet-optimized with collapsible sidebar
- Mobile-friendly with hamburger menu
- Touch-optimized drag-and-drop

## 🎯 UI/UX Highlights

- **Modern SaaS Design**: Clean, professional interface with indigo accent color
- **Smooth Animations**: Motion-powered transitions and micro-interactions
- **Keyboard Shortcuts**: ESC to close, Cmd+Shift+A for activity, Cmd+K for search
- **Visual Hierarchy**: Clear information architecture with proper spacing
- **Accessibility**: Built on Radix UI primitives for keyboard navigation
- **Loading States**: Skeleton screens and loading indicators
- **Empty States**: Helpful prompts when no data exists

## 🔧 State Management

Zustand store manages:
- Boards, lists, and tasks
- Current view and selected items
- Activity log (last 50 events)
- User information and online status
- UI state (sidebar collapsed, panels open)

## 🎨 Design System

- **Colors**: Indigo primary, with semantic colors for states
- **Spacing**: 8px grid system
- **Typography**: System font stack with proper hierarchy
- **Shadows**: Subtle elevation with soft shadows
- **Borders**: 12-16px border radius for modern feel
- **Animations**: 200-300ms transitions for smoothness

## 📱 Responsive Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: > 1024px (xl, 2xl)

## 🚀 Getting Started

The application loads with:
- 4 pre-configured boards
- Sample tasks in "Product Roadmap Q1" board
- 4 team members (3 online)
- Recent activity history

## 🎮 Interactions

1. **Create Board**: Click "Create Board" in sidebar or dashboard
2. **View Board**: Click any board card or sidebar item
3. **Create List**: Click "+ Add List" in board view
4. **Create Task**: Click "+ Add Task" in any list
5. **Move Task**: Drag and drop between lists
6. **Edit Task**: Click any task card to open modal
7. **View Activity**: Click activity icon in topbar
8. **Assign Users**: Click assignee buttons in task modal

## 🔮 Future Enhancements

- Real Socket.IO integration
- Backend API connection (Supabase/Firebase)
- Search functionality
- Task filtering and sorting
- Custom fields
- File attachments
- Comments system
- Board templates
- Advanced permissions

## 📝 Notes

This is a frontend-only implementation with:
- Mock data for demonstration
- Local state management (no persistence)
- Simulated real-time updates
- Sample activity log

For production use, connect to:
- Real-time backend (Socket.IO server)
- Database (PostgreSQL, MongoDB)
- Authentication system
- File storage service
