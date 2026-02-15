import { create } from 'zustand';
import { authApi, boardsApi, listsApi, tasksApi, activitiesApi, setToken, getToken } from '../services/api';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  online: boolean;
}

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignees: string[]; // User IDs
  dueDate?: string;
  listId: string;
  boardId: string;
  createdAt: string;
  order: number;
  priority?: Priority;
  tags?: string[];
  status: TaskStatus;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface List {
  id: string;
  title: string;
  boardId: string;
  order: number;
  taskIds: string[];
}

export interface Board {
  id: string;
  title: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  memberIds: string[];
  taskCount?: number;
  description?: string;
}

export interface BoardFilters {
  search: string;
  priority: Priority | 'all';
  assigneeId: string | 'all';
}

export interface Activity {
  id: string;
  type: 'task_created' | 'task_moved' | 'task_updated' | 'task_assigned' | 'list_created' | 'user_joined';
  message: string;
  userId: string;
  boardId: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  type: 'task_assigned' | 'task_due' | 'mention' | 'general';
}

// ── Mock Data (used when no backend is available) ─────────────────────

const mockUsers: User[] = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@example.com', avatar: 'SC', online: true },
  { id: '2', name: 'Alex Rivera', email: 'alex@example.com', avatar: 'AR', online: true },
  { id: '3', name: 'Jordan Smith', email: 'jordan@example.com', avatar: 'JS', online: true },
  { id: '4', name: 'Emma Wilson', email: 'emma@example.com', avatar: 'EW', online: true },
  { id: '5', name: 'David Kim', email: 'david@example.com', avatar: 'DK', online: true },
];

const mockBoards: Board[] = [
  {
    id: 'board-1',
    title: 'Product Launch Q1',
    color: '#6366f1',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-02-14T15:30:00Z',
    memberIds: ['1', '2', '3'],
    taskCount: 8,
    description: 'Q1 product launch planning and execution',
  },
  {
    id: 'board-2',
    title: 'Engineering Sprint',
    color: '#8b5cf6',
    createdAt: '2025-02-01T09:00:00Z',
    updatedAt: '2025-02-13T11:00:00Z',
    memberIds: ['1', '4'],
    taskCount: 5,
    description: 'Current sprint tasks and bugs',
  },
  {
    id: 'board-3',
    title: 'Design System',
    color: '#ec4899',
    createdAt: '2025-01-20T14:00:00Z',
    updatedAt: '2025-02-12T09:00:00Z',
    memberIds: ['2', '3'],
    taskCount: 3,
    description: 'Component library and design tokens',
  },
];

const mockLists: List[] = [
  { id: 'list-1', title: 'To Do', boardId: 'board-1', order: 0, taskIds: ['task-1', 'task-2', 'task-3'] },
  { id: 'list-2', title: 'In Progress', boardId: 'board-1', order: 1, taskIds: ['task-4', 'task-5'] },
  { id: 'list-3', title: 'Review', boardId: 'board-1', order: 2, taskIds: ['task-6'] },
  { id: 'list-4', title: 'Done', boardId: 'board-1', order: 3, taskIds: ['task-7', 'task-8'] },
  { id: 'list-5', title: 'Backlog', boardId: 'board-2', order: 0, taskIds: ['task-9', 'task-10'] },
  { id: 'list-6', title: 'In Progress', boardId: 'board-2', order: 1, taskIds: ['task-11', 'task-12'] },
  { id: 'list-7', title: 'Done', boardId: 'board-2', order: 2, taskIds: ['task-13'] },
];

const mockTasks: Task[] = [
  {
    id: 'task-1', title: 'Design landing page mockup', description: 'Create high-fidelity mockup for the new landing page, including hero section, features overview, and testimonials.',
    assignees: ['2', '3'], listId: 'list-1', boardId: 'board-1', createdAt: '2025-02-10T09:00:00Z',
    order: 0, priority: 'high', tags: ['design', 'landing-page'], status: 'active',
    comments: [
      { id: 'c1', taskId: 'task-1', userId: '2', content: 'I have started working on the hero section. Should have a draft by tomorrow.', createdAt: '2025-02-11T10:00:00Z' },
      { id: 'c2', taskId: 'task-1', userId: '3', content: 'Great! I\u2019ll handle the features overview section.', createdAt: '2025-02-11T14:00:00Z' },
    ],
  },
  {
    id: 'task-2', title: 'Write API documentation', description: 'Document all REST endpoints with request/response examples.',
    assignees: ['1'], listId: 'list-1', boardId: 'board-1', createdAt: '2025-02-10T10:00:00Z',
    order: 1, priority: 'medium', tags: ['docs', 'api'], status: 'active', dueDate: '2025-02-20T23:59:00Z',
  },
  {
    id: 'task-3', title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment.',
    assignees: ['4'], listId: 'list-1', boardId: 'board-1', createdAt: '2025-02-09T14:00:00Z',
    order: 2, priority: 'high', tags: ['devops'], status: 'active', dueDate: '2025-02-16T23:59:00Z',
  },
  {
    id: 'task-4', title: 'Implement user authentication', description: 'Add JWT-based authentication with login, signup, and password reset.',
    assignees: ['1', '4'], listId: 'list-2', boardId: 'board-1', createdAt: '2025-02-08T09:00:00Z',
    order: 0, priority: 'high', tags: ['auth', 'backend'], status: 'active',
    comments: [
      { id: 'c3', taskId: 'task-4', userId: '1', content: 'Login and signup are done. Working on password reset next.', createdAt: '2025-02-12T16:00:00Z' },
    ],
  },
  {
    id: 'task-5', title: 'Build notification system', description: 'Real-time notifications for task assignments, mentions, and due dates.',
    assignees: ['1'], listId: 'list-2', boardId: 'board-1', createdAt: '2025-02-07T11:00:00Z',
    order: 1, priority: 'medium', tags: ['notifications', 'real-time'], status: 'active',
  },
  {
    id: 'task-6', title: 'Review PR: Dashboard redesign', description: 'Review the pull request for the new dashboard layout with analytics widgets.',
    assignees: ['2'], listId: 'list-3', boardId: 'board-1', createdAt: '2025-02-11T15:00:00Z',
    order: 0, priority: 'medium', tags: ['review'], status: 'active',
  },
  {
    id: 'task-7', title: 'Database schema migration', description: 'Migrate from MongoDB to PostgreSQL schema.',
    assignees: ['4'], listId: 'list-4', boardId: 'board-1', createdAt: '2025-02-05T10:00:00Z',
    order: 0, priority: 'low', tags: ['database'], status: 'completed',
  },
  {
    id: 'task-8', title: 'Set up project repository', description: 'Initialize project with Vite, React, TypeScript, and configure ESLint.',
    assignees: ['1'], listId: 'list-4', boardId: 'board-1', createdAt: '2025-02-01T09:00:00Z',
    order: 1, priority: 'low', tags: ['setup'], status: 'completed',
  },
  {
    id: 'task-9', title: 'Performance audit', description: 'Run Lighthouse audit and fix key performance issues.',
    assignees: ['4'], listId: 'list-5', boardId: 'board-2', createdAt: '2025-02-10T09:00:00Z',
    order: 0, priority: 'medium', tags: ['performance'], status: 'active',
  },
  {
    id: 'task-10', title: 'Add dark mode support', description: 'Implement dark mode toggle using CSS variables and Zustand theme state.',
    assignees: ['2'], listId: 'list-5', boardId: 'board-2', createdAt: '2025-02-09T14:00:00Z',
    order: 1, priority: 'low', tags: ['ui', 'theme'], status: 'active',
  },
  {
    id: 'task-11', title: 'Fix drag-and-drop bug', description: 'Tasks sometimes snap back after dropping in a different list.',
    assignees: ['1'], listId: 'list-6', boardId: 'board-2', createdAt: '2025-02-12T10:00:00Z',
    order: 0, priority: 'high', tags: ['bug', 'dnd'], status: 'active',
  },
  {
    id: 'task-12', title: 'Implement search', description: 'Add global search across boards and tasks with highlighting.',
    assignees: ['1', '2'], listId: 'list-6', boardId: 'board-2', createdAt: '2025-02-11T11:00:00Z',
    order: 1, priority: 'medium', tags: ['search', 'feature'], status: 'active',
  },
  {
    id: 'task-13', title: 'Responsive sidebar', description: 'Make sidebar collapsible and mobile-friendly.',
    assignees: ['2'], listId: 'list-7', boardId: 'board-2', createdAt: '2025-02-06T09:00:00Z',
    order: 0, priority: 'low', tags: ['ui', 'responsive'], status: 'completed',
  },
];

const mockActivities: Activity[] = [
  { id: 'act-1', type: 'task_created', message: 'created "Design landing page mockup"', userId: '2', boardId: 'board-1', timestamp: '2025-02-14T15:00:00Z' },
  { id: 'act-2', type: 'task_moved', message: 'moved "Implement user authentication" to In Progress', userId: '1', boardId: 'board-1', timestamp: '2025-02-14T14:30:00Z' },
  { id: 'act-3', type: 'task_assigned', message: 'assigned "Build notification system" to Sarah', userId: '4', boardId: 'board-1', timestamp: '2025-02-14T13:00:00Z' },
  { id: 'act-4', type: 'task_updated', message: 'updated "Review PR: Dashboard redesign"', userId: '2', boardId: 'board-1', timestamp: '2025-02-14T12:00:00Z' },
  { id: 'act-5', type: 'user_joined', message: 'joined the board', userId: '3', boardId: 'board-1', timestamp: '2025-02-14T10:00:00Z' },
];

const mockNotifications: Notification[] = [
  { id: 'n1', title: 'Task assigned', message: 'You were assigned to "Write API documentation"', read: false, timestamp: '2025-02-14T15:00:00Z', type: 'task_assigned' },
  { id: 'n2', title: 'Due date approaching', message: '"Set up CI/CD pipeline" is due tomorrow', read: false, timestamp: '2025-02-14T12:00:00Z', type: 'task_due' },
  { id: 'n3', title: 'New comment', message: 'Alex commented on "Design landing page mockup"', read: true, timestamp: '2025-02-13T16:00:00Z', type: 'mention' },
];

// ── Helper to generate IDs ────────────────────────────────────────────
let idCounter = 100;
function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${idCounter++}`;
}

// ── Store Interface ───────────────────────────────────────────────────

interface AppState {
  // Authentication
  isAuthenticated: boolean;
  currentUser: User | null;

  // View state
  currentView: 'dashboard' | 'board';
  selectedBoardId: string | null;
  selectedTaskId: string | null;
  isActivityPanelOpen: boolean;
  isSidebarCollapsed: boolean;
  isSettingsOpen: boolean;
  theme: 'light' | 'dark';

  // Data
  boards: Board[];
  lists: List[];
  tasks: Task[];
  users: User[];
  activities: Activity[];
  notifications: Notification[];

  // Pagination
  boardsPage: number;
  boardsTotal: number;
  activitiesPage: number;
  activitiesTotal: number;

  // Search & Filter
  searchQuery: string;
  boardSortBy: 'lastUpdated' | 'alphabetical';
  boardFilters: BoardFilters;

  // Loading
  isLoadingBoards: boolean;
  isLoadingBoard: boolean;
  isLoadingActivities: boolean;

  // Editing states
  editingUsers: { [taskId: string]: string[] };

  // Auth Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;

  // View Actions
  setCurrentView: (view: 'dashboard' | 'board') => void;
  setSelectedBoardId: (id: string | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  toggleActivityPanel: () => void;
  toggleSidebar: () => void;
  toggleSettings: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSearchQuery: (query: string) => void;
  setBoardSortBy: (sortBy: 'lastUpdated' | 'alphabetical') => void;
  setBoardFilters: (filters: Partial<BoardFilters>) => void;

  // Board actions
  fetchBoards: (page?: number) => Promise<void>;
  fetchBoard: (id: string) => Promise<void>;
  createBoard: (title: string, color: string, memberIds?: string[]) => void;
  deleteBoard: (id: string) => void;
  updateBoard: (id: string, updates: Partial<Board>) => void;

  // User actions
  fetchUsers: () => Promise<void>;

  // List actions
  createList: (boardId: string, title: string) => void;
  updateListTitle: (id: string, title: string) => void;
  deleteList: (id: string) => void;
  reorderLists: (boardId: string, listIds: string[]) => void;

  // Task actions
  createTask: (listId: string, boardId: string, title: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  moveTask: (taskId: string, fromListId: string, toListId: string, newOrder: number) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  addComment: (taskId: string, content: string) => void;

  // Activity
  fetchActivities: (boardId: string, page?: number) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;

  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Real-time indicators
  setUserEditing: (taskId: string, userId: string) => void;
  removeUserEditing: (taskId: string, userId: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state — empty until login
  isAuthenticated: false,
  currentUser: null,
  currentView: 'dashboard',
  selectedBoardId: null,
  selectedTaskId: null,
  isActivityPanelOpen: false,
  isSidebarCollapsed: typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  isSettingsOpen: false,
  theme: 'light',

  boards: [],
  lists: [],
  tasks: [],
  users: [],
  activities: [],
  notifications: [],

  boardsPage: 1,
  boardsTotal: 0,
  activitiesPage: 1,
  activitiesTotal: 0,

  searchQuery: '',
  boardSortBy: 'lastUpdated',
  boardFilters: {
    search: '',
    priority: 'all',
    assigneeId: 'all',
  },
  editingUsers: {},

  isLoadingBoards: false,
  isLoadingBoard: false,
  isLoadingActivities: false,

  // ── Auth Actions ──────────────────────────────────────────────────

  login: async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      const { token, user } = response;
      setToken(token);

      const appUser: User = {
        id: user.id || user._id,
        name: user.username || user.name,
        email: user.email,
        avatar: (user.username || user.name || '')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        online: true,
      };

      set({ isAuthenticated: true, currentUser: appUser });
      return true;
    } catch {
      const mockUser = mockUsers.find((u) => u.email === email);
      if (mockUser) {
        set({
          isAuthenticated: true,
          currentUser: mockUser,
          users: mockUsers,
          boards: mockBoards,
          lists: mockLists,
          tasks: mockTasks,
          activities: mockActivities,
          notifications: mockNotifications,
          boardsTotal: mockBoards.length,
        });
        toast.success(`Welcome back, ${mockUser.name}!`);
        return true;
      }

      // If API fails and not a mock user, propagate error
      toast.error('Invalid email or password');
      return false;
    }
  },

  signup: async (name: string, email: string, password: string) => {
    try {
      const response = await authApi.signup({ email, password, username: name });
      const { token, user } = response;
      setToken(token);

      const appUser: User = {
        id: user.id || user._id,
        name: user.username || user.name || name,
        email: user.email || email,
        avatar: (name || '')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        online: true,
      };

      set({
        isAuthenticated: true,
        currentUser: appUser,
        users: [...get().users, appUser],
      });
      return true;
    } catch {
      // Fallback to mock signup
      const demoUser: User = {
        id: generateId('user'),
        name,
        email,
        avatar: name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        online: true,
      };
      set({
        isAuthenticated: true,
        currentUser: demoUser,
        users: [...mockUsers, demoUser],
        boards: mockBoards,
        lists: mockLists,
        tasks: mockTasks,
        activities: mockActivities,
        notifications: mockNotifications,
        boardsTotal: mockBoards.length,
      });
      toast.success(`Welcome, ${name}! (Demo Mode)`);
      return true;
    }
  },

  logout: () => {
    authApi.logout().catch(() => { });
    setToken(null);
    set({
      isAuthenticated: false,
      currentUser: null,
      selectedBoardId: null,
      selectedTaskId: null,
      currentView: 'dashboard',
      boards: [],
      lists: [],
      tasks: [],
      activities: [],
      notifications: [],
    });
  },

  checkAuth: async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await authApi.me();
      const user = response.user || response;

      const appUser: User = {
        id: user.id || user._id,
        name: user.username || user.name,
        email: user.email,
        avatar: (user.username || user.name || '')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        online: true,
      };

      set({ isAuthenticated: true, currentUser: appUser });
    } catch {
      setToken(null);
    }
  },

  // ── View Actions ──────────────────────────────────────────────────

  setCurrentView: (view) => set({ currentView: view }),

  setSelectedBoardId: (id) => {
    set({
      selectedBoardId: id,
      currentView: id ? 'board' : 'dashboard'
    });

    if (id) {
      get().fetchBoard(id);
    }
  },

  setSelectedTaskId: (id) => set({ selectedTaskId: id }),

  toggleActivityPanel: () => set((state) => ({
    isActivityPanelOpen: !state.isActivityPanelOpen
  })),

  toggleSidebar: () => set((state) => ({
    isSidebarCollapsed: !state.isSidebarCollapsed
  })),

  toggleSettings: () => set((state) => ({
    isSettingsOpen: !state.isSettingsOpen
  })),

  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setBoardSortBy: (sortBy) => set({ boardSortBy: sortBy }),

  setBoardFilters: (filters) =>
    set((state) => ({
      boardFilters: { ...state.boardFilters, ...filters },
    })),

  // ── Board Actions ─────────────────────────────────────────────────

  fetchBoards: async (page = 1) => {
    set({ isLoadingBoards: true });
    try {
      const response = await boardsApi.list(page);
      const boards: Board[] = (response.boards || []).map((b: any) => ({
        id: b.id || b._id,
        title: b.name || b.title,
        color: b.color || '#6366f1',
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        memberIds: b.members?.map((m: any) => (m.user?.id || m.user?._id || m.userId || m)) || [],
        taskCount: b.taskCount || 0,
        description: b.description || '',
      }));
      set({ boards, boardsPage: page, boardsTotal: response.total || boards.length });
    } catch {
      // In mock mode, boards are already loaded on login — nothing to do
    } finally {
      set({ isLoadingBoards: false });
    }
  },

  fetchBoard: async (id: string) => {
    set({ isLoadingBoard: true });
    try {
      const boardData = await boardsApi.get(id);
      const board = boardData.board || boardData;

      const mappedBoard: Board = {
        id: board.id || board._id,
        title: board.name || board.title,
        color: board.color || '#6366f1',
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        memberIds: board.members?.map((m: any) => (m.user?.id || m.user?._id || m.userId || m)) || [],
        taskCount: board.taskCount || 0,
        description: board.description || '',
      };

      set((state) => ({
        boards: state.boards.some((b) => b.id === mappedBoard.id)
          ? state.boards.map((b) => b.id === mappedBoard.id ? mappedBoard : b)
          : [...state.boards, mappedBoard],
      }));

      const listsData = await listsApi.getByBoard(id);
      const listsArray = Array.isArray(listsData) ? listsData : (listsData as any).lists || [];

      const mappedLists: List[] = listsArray.map((l: any) => ({
        id: l.id || l._id,
        title: l.name || l.title,
        boardId: id,
        order: l.position ?? l.order ?? 0,
        taskIds: l.tasks?.map((t: any) => t.id || t._id || t) || [],
      }));

      const allTasks: Task[] = [];
      for (const l of listsArray) {
        const tasks = l.tasks || [];
        for (const t of tasks) {
          if (typeof t === 'object') {
            allTasks.push({
              id: t.id || t._id,
              title: t.title,
              description: t.description || '',
              assignees: (t.assignments || t.assignees || []).map((a: any) => a.userId || a.user?.id || a.user?._id || a.id || a),
              dueDate: t.dueDate,
              listId: l.id || l._id,
              boardId: id,
              createdAt: t.createdAt,
              order: t.position ?? t.order ?? 0,
              priority: t.priority || 'medium',
              tags: t.tags || [],
              status: t.status || 'active',
              comments: t.comments || [],
            });
          }
        }
      }

      const updatedLists = mappedLists.map((list) => ({
        ...list,
        taskIds: allTasks.filter((t) => t.listId === list.id).map((t) => t.id),
      }));

      set((state) => ({
        lists: [
          ...state.lists.filter((l) => l.boardId !== id),
          ...updatedLists,
        ],
        tasks: [
          ...state.tasks.filter((t) => t.boardId !== id),
          ...allTasks,
        ],
      }));

      if (board.members && Array.isArray(board.members)) {
        const memberUsers: User[] = board.members
          .filter((m: any) => typeof m === 'object')
          .map((m: any) => ({
            id: m.id || m._id,
            name: m.username || m.name,
            email: m.email || '',
            avatar: (m.username || m.name || '')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
            online: m.online ?? false,
          }));

        set((state) => {
          const existingIds = new Set(state.users.map((u) => u.id));
          const newUsers = memberUsers.filter((u) => !existingIds.has(u.id));
          return {
            users: [
              ...state.users.map((u) => {
                const updated = memberUsers.find((m) => m.id === u.id);
                return updated ? { ...u, ...updated } : u;
              }),
              ...newUsers,
            ],
          };
        });
      }

      get().fetchActivities(id);
    } catch {
      // In mock mode, data is already loaded — no action needed
    } finally {
      set({ isLoadingBoard: false });
    }
  },

  createBoard: (title, color, memberIds = []) => {
    const newBoard: Board = {
      id: generateId('board'),
      title,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberIds: [get().currentUser?.id || '1', ...memberIds],
      taskCount: 0,
    };
    set((state) => ({ boards: [...state.boards, newBoard] }));

    // Try API, ignore failure in mock mode
    boardsApi.create({ name: title, description: '', color, memberIds })
      .then((response) => {
        const created = response.board || response;
        if (created.id || created._id) {
          set((state) => ({
            boards: state.boards.map((b) =>
              b.id === newBoard.id
                ? { ...b, id: created.id || created._id }
                : b
            ),
          }));
        }
      })
      .catch(() => { });

    get().addActivity({
      type: 'task_created',
      message: `created board "${title}"`,
      userId: get().currentUser?.id || '1',
      boardId: newBoard.id,
    });
    toast.success(`Board "${title}" created!`);
  },

  deleteBoard: (id) => {
    const board = get().boards.find((b) => b.id === id);
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== id),
      lists: state.lists.filter((l) => l.boardId !== id),
      tasks: state.tasks.filter((t) => t.boardId !== id),
    }));

    boardsApi.delete(id).catch(() => { });
    toast.success(`Board "${board?.title}" deleted`);
  },

  updateBoard: (id, updates) => {
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      ),
    }));

    const apiUpdates: any = {};
    if (updates.title) apiUpdates.name = updates.title;
    if (updates.description !== undefined) apiUpdates.description = updates.description;
    if (Object.keys(apiUpdates).length > 0) {
      boardsApi.update(id, apiUpdates).catch(() => { });
    }
  },

  // ── List Actions ──────────────────────────────────────────────────

  createList: (boardId, title) => {
    const lists = get().lists.filter((l) => l.boardId === boardId);
    const newList: List = {
      id: generateId('list'),
      title,
      boardId,
      order: lists.length,
      taskIds: [],
    };
    set((state) => ({ lists: [...state.lists, newList] }));

    listsApi.create(boardId, { name: title, position: newList.order })
      .then((response) => {
        const created = response.list || response;
        if (created.id || created._id) {
          set((state) => ({
            lists: state.lists.map((l) =>
              l.id === newList.id
                ? { ...l, id: created.id || created._id }
                : l
            ),
          }));
        }
      })
      .catch(() => { });

    get().addActivity({
      type: 'list_created',
      message: `created list "${title}"`,
      userId: get().currentUser?.id || '1',
      boardId,
    });
  },

  updateListTitle: (id, title) => {
    set((state) => ({
      lists: state.lists.map((l) => (l.id === id ? { ...l, title } : l)),
    }));
    listsApi.update(id, { name: title }).catch(() => { });
  },

  deleteList: (id) => {
    const list = get().lists.find((l) => l.id === id);
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== id),
      tasks: state.tasks.filter((t) => t.listId !== id),
    }));
    listsApi.delete(id).catch(() => { });
    if (list) {
      toast.success(`List "${list.title}" deleted`);
    }
  },

  reorderLists: (boardId, listIds) => {
    set((state) => ({
      lists: state.lists.map((l) => {
        if (l.boardId !== boardId) return l;
        const newOrder = listIds.indexOf(l.id);
        return newOrder >= 0 ? { ...l, order: newOrder } : l;
      }),
    }));

    // Fire-and-forget API calls
    listIds.forEach((id, index) => {
      listsApi.update(id, { position: index }).catch(() => { });
    });
  },

  // ── Task Actions ──────────────────────────────────────────────────

  createTask: (listId, boardId, title) => {
    const list = get().lists.find((l) => l.id === listId);
    const position = list?.taskIds.length || 0;

    const newTask: Task = {
      id: generateId('task'),
      title,
      description: '',
      assignees: [],
      listId,
      boardId,
      createdAt: new Date().toISOString(),
      order: position,
      priority: 'medium',
      tags: [],
      status: 'active',
      comments: [],
    };

    set((state) => ({
      tasks: [...state.tasks, newTask],
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, taskIds: [...l.taskIds, newTask.id] } : l
      ),
    }));

    tasksApi.create(listId, { title, position })
      .then((response) => {
        const created = response.task || response;
        if (created.id || created._id) {
          const realId = created.id || created._id;
          const mappedAssignees = (created.assignments || created.assignees || []).map((a: any) => a.userId || a.user?.id || a.user?._id || a.id || a);
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === newTask.id ? { ...t, id: realId, assignees: mappedAssignees } : t
            ),
            lists: state.lists.map((l) =>
              l.id === listId
                ? { ...l, taskIds: l.taskIds.map((tid) => tid === newTask.id ? realId : tid) }
                : l
            ),
          }));
        }
      })
      .catch(() => { });

    get().addActivity({
      type: 'task_created',
      message: `created task "${title}"`,
      userId: get().currentUser?.id || '1',
      boardId,
    });
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));

    // Fire-and-forget API update
    const apiUpdates: any = {};
    if (updates.title !== undefined) apiUpdates.title = updates.title;
    if (updates.description !== undefined) apiUpdates.description = updates.description;
    if (updates.listId !== undefined) apiUpdates.listId = updates.listId;
    if (updates.order !== undefined) apiUpdates.position = updates.order;

    if (Object.keys(apiUpdates).length > 0) {
      tasksApi.update(id, apiUpdates)
        .then((response) => {
          const updated = response.task || response;
          if (updated.assignments || updated.assignees) {
            const mappedAssignees = (updated.assignments || updated.assignees || []).map((a: any) => a.userId || a.user?.id || a.user?._id || a.id || a);
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, assignees: mappedAssignees } : t
              ),
            }));
          }
        })
        .catch(() => { });
    }
  },

  moveTask: (taskId, fromListId, toListId, newOrder) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, listId: toListId, order: newOrder } : t
      ),
      lists: state.lists.map((l) => {
        if (l.id === fromListId) {
          return { ...l, taskIds: l.taskIds.filter((id) => id !== taskId) };
        }
        if (l.id === toListId) {
          const newTaskIds = [...l.taskIds];
          newTaskIds.splice(newOrder, 0, taskId);
          return { ...l, taskIds: newTaskIds };
        }
        return l;
      }),
    }));

    tasksApi.update(taskId, { listId: toListId, position: newOrder }).catch(() => { });

    get().addActivity({
      type: 'task_moved',
      message: `moved a task to another list`,
      userId: get().currentUser?.id || '1',
      boardId: get().tasks.find((t) => t.id === taskId)?.boardId || '',
    });
  },

  deleteTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      lists: state.lists.map((l) =>
        l.id === task.listId
          ? { ...l, taskIds: l.taskIds.filter((tid) => tid !== id) }
          : l
      ),
    }));

    tasksApi.delete(id).catch(() => { });
    toast.success(`Task "${task.title}" deleted`);
  },

  toggleTaskComplete: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus: TaskStatus = task.status === 'active' ? 'completed' : 'active';
    get().updateTask(id, { status: newStatus });
  },

  addComment: (taskId, content) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newComment: Comment = {
      id: generateId('comment'),
      taskId,
      userId: get().currentUser?.id || '1',
      content,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, comments: [...(t.comments || []), newComment] }
          : t
      ),
    }));
  },

  // ── Activities ────────────────────────────────────────────────────

  fetchActivities: async (boardId, page = 1) => {
    set({ isLoadingActivities: true });
    try {
      const response = await activitiesApi.getByBoard(boardId, page);
      const activities: Activity[] = (response.activities || []).map((a: any) => ({
        id: a.id || a._id,
        type: a.type || 'task_updated',
        message: a.message || a.description || '',
        userId: a.userId || a.user?.id || a.user?._id || '',
        boardId,
        timestamp: a.timestamp || a.createdAt,
      }));
      set({ activities, activitiesPage: page, activitiesTotal: response.total || activities.length });
    } catch {
      // In mock mode, activities are already loaded
    } finally {
      set({ isLoadingActivities: false });
    }
  },

  addActivity: (activity) => {
    const newActivity: Activity = {
      ...activity,
      id: generateId('act'),
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      activities: [newActivity, ...state.activities].slice(0, 50),
    }));
  },

  // ── Notifications ─────────────────────────────────────────────────

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId('notif'),
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  // ── Real-time Indicators ──────────────────────────────────────────

  setUserEditing: (taskId, userId) => {
    set((state) => ({
      editingUsers: {
        ...state.editingUsers,
        [taskId]: [...(state.editingUsers[taskId] || []), userId],
      },
    }));
  },

  removeUserEditing: (taskId, userId) => {
    set((state) => ({
      editingUsers: {
        ...state.editingUsers,
        [taskId]: (state.editingUsers[taskId] || []).filter((id) => id !== userId),
      },
    }));
  },

  fetchUsers: async () => {
    try {
      const response = await authApi.getUsers();
      const apiUsers = response.users || [];
      const mappedUsers = apiUsers.map((u: any) => ({
        id: u.id || u._id,
        name: u.username || u.name,
        email: u.email,
        avatar: (u.username || u.name || '')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        online: false,
      }));

      set((state) => {
        const existingIds = new Set(state.users.map((u) => u.id));
        const newUsers = mappedUsers.filter((u: any) => !existingIds.has(u.id));
        return {
          users: [
            ...state.users.map((u) => {
              const updated = mappedUsers.find((m: any) => m.id === u.id);
              return updated ? { ...u, ...updated } : u;
            }),
            ...newUsers,
          ],
        };
      });
    } catch {
      // Ignore in mock mode
    }
  },
}));