import { create } from 'zustand';
import { authApi, boardsApi, listsApi, tasksApi, activitiesApi, commentsApi, setToken, getToken } from '../services/api';
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
  creatorId: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
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
  description: string;
  color: string;
  memberIds: string[];
  ownerId: string;
  owner?: { id: string; username: string; email: string };
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  lists: number;
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

  // Task Creation state
  isCreateTaskModalOpen: boolean;
  createTaskTargetListId: string | null;
  createTaskTargetBoardId: string | null;

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
  lastFetchAttempts: { [boardId: string]: number };
  lastBoardsFetch: number;
  lastUsersFetch: number;
  lastAuthCheck: number;

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
  openCreateTaskModal: (boardId: string, listId: string) => void;
  closeCreateTaskModal: () => void;

  // Board actions
  fetchBoards: (page?: number) => Promise<void>;
  fetchBoard: (id: string) => Promise<void>;
  createBoard: (title: string, color: string, memberIds?: string[]) => void;
  deleteBoard: (id: string) => void;
  updateBoard: (id: string, updates: Partial<Board>) => void;

  // User actions
  fetchUsers: () => Promise<void>;
  updateProfile: (data: { username: string }) => Promise<void>;
  updatePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;

  // List actions
  createList: (boardId: string, title: string) => void;
  updateListTitle: (id: string, title: string) => void;
  deleteList: (id: string) => void;
  reorderLists: (boardId: string, listIds: string[]) => void;

  // Task actions
  createTask: (listId: string, boardId: string, title: string, extraData?: Partial<Task>) => void;
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

  // Real-time update actions (received from socket)
  onTaskCreated: (task: any) => void;
  onTaskUpdated: (task: any) => void;
  onTaskDeleted: (taskId: string, listId: string) => void;
  onTaskMoved: (taskId: string, oldListId: string, newListId: string, newPosition: number, task: any) => void;
  onTaskAssigned: (taskId: string, userId: string, assignment: any) => void;
  onTaskUnassigned: (taskId: string, userId: string) => void;
  onListCreated: (list: any) => void;
  onListUpdated: (list: any) => void;
  onListDeleted: (listId: string) => void;
  onBoardUpdated: (board: any) => void;
  onBoardCreated: (board: any) => void;
  onBoardDeleted: (boardId: string) => void;
  onCommentAdded: (data: { comment: any; taskId: string }) => void;
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
  // Task Creation
  isCreateTaskModalOpen: false,
  createTaskTargetListId: null,
  createTaskTargetBoardId: null,
  lastFetchAttempts: {},
  lastBoardsFetch: 0,
  lastUsersFetch: 0,
  lastAuthCheck: 0,
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
    } catch (error: any) {
      console.error('[useStore] Login failed:', error);
      toast.error(error.message || 'Invalid email or password');
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
    } catch (error: any) {
      console.error('[useStore] Signup failed:', error);
      toast.error(error.message || 'Could not create account');
      return false;
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

  updateProfile: async (data: { username: string }) => {
    try {
      const response = await authApi.updateProfile(data);
      const user = response.user || response;
      set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, name: user.username || user.name } : null
      }));
    } catch (error: any) {
      console.error('[useStore] updateProfile failed:', error);
      throw error;
    }
  },

  updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
    try {
      await authApi.updatePassword(data);
    } catch (error: any) {
      console.error('[useStore] updatePassword failed:', error);
      throw error;
    }
  },

  checkAuth: async () => {
    const now = Date.now();
    if (now - get().lastAuthCheck < 5000) return;

    console.log('[useStore] checkAuth() called');
    set({ lastAuthCheck: now });

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

      console.log(`[useStore] checkAuth success: ${appUser.email}`);
      set({ isAuthenticated: true, currentUser: appUser });
    } catch (error) {
      console.log('[useStore] checkAuth failed, logging out');
      // On error, logout
      set({ isAuthenticated: false, currentUser: null });
      setToken(null);
    }
  },

  // ── View Actions ──────────────────────────────────────────────────

  setCurrentView: (view) => {
    const current = get().currentView;
    if (current !== view) {
      console.log(`[useStore] currentView changed: ${current} -> ${view}`);
      set({ currentView: view });
    }
  },

  setSelectedBoardId: (id) => {
    const current = get().selectedBoardId;
    if (current === id) return;

    console.log(`[useStore] selectedBoardId changed: ${current} -> ${id}`);
    const nextView = id ? 'board' : 'dashboard';

    set({
      selectedBoardId: id,
      currentView: nextView
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

  openCreateTaskModal: (boardId, listId) => set({
    isCreateTaskModalOpen: true,
    createTaskTargetBoardId: boardId,
    createTaskTargetListId: listId
  }),

  closeCreateTaskModal: () => set({
    isCreateTaskModalOpen: false,
    createTaskTargetBoardId: null,
    createTaskTargetListId: null
  }),

  // ── Board Actions ─────────────────────────────────────────────────

  fetchBoards: async (page = 1) => {
    const now = Date.now();
    if (get().isLoadingBoards || now - get().lastBoardsFetch < 5000) return;

    console.log(`[useStore] fetchBoards(page=${page}) called`);
    set({ isLoadingBoards: true, lastBoardsFetch: now });
    try {
      const response = await boardsApi.list(page);
      const boards: Board[] = (response.boards || []).map((b: any) => ({
        id: b.id || b._id,
        title: b.name || b.title,
        description: b.description || '',
        color: b.color || '#6366f1',
        createdAt: b.createdAt || b.updatedAt,
        updatedAt: b.updatedAt || b.createdAt,
        ownerId: b.ownerId,
        owner: b.owner,
        memberIds: (b.members || []).map((m: any) => m.userId || m.id || m),
        taskCount: b.taskCount || 0,
        lists: (b.lists || []).length,
      }));
      set({ boards, boardsPage: page, boardsTotal: response.total || boards.length });
    } catch (error) {
      console.error('[useStore] fetchBoards failed:', error);
    } finally {
      set({ isLoadingBoards: false });
    }
  },

  fetchBoard: async (id: string) => {
    // Guard: Don't fetch if already loading THIS board
    const state = get();
    const now = Date.now();
    const lastAttempt = state.lastFetchAttempts[id] || 0;

    if (state.isLoadingBoard && state.selectedBoardId === id) {
      return;
    }

    // Skip if fetched very recently (within 5 seconds)
    if (now - lastAttempt < 5000) {
      return;
    }

    console.log(`[useStore] fetchBoard(${id}) called at ${new Date().toISOString()}`);
    // console.trace('fetchBoard trace:'); // Uncomment if needed for deep debugging

    set((state) => ({
      isLoadingBoard: true,
      lastFetchAttempts: { ...state.lastFetchAttempts, [id]: now }
    }));
    try {
      const boardData = await boardsApi.get(id);
      const board = boardData.board || boardData;

      const mappedBoard: Board = {
        id: board.id || board._id,
        title: board.name || board.title,
        description: board.description || '',
        color: board.color || '#6366f1',
        ownerId: board.ownerId,
        owner: board.owner,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        memberIds: board.members?.map((m: any) => (m.user?.id || m.user?._id || m.userId || m)) || [],
        taskCount: board.taskCount || 0,
        lists: (board.lists || []).length,
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
              assignees: (t.assignments || t.assignees || []).map((a: any) =>
                typeof a === 'string' ? a : (a.userId || a.user?.id || a.user?._id || a.id)
              ),
              dueDate: t.dueDate,
              listId: l.id || l._id,
              boardId: id,
              createdAt: t.createdAt,
              order: t.position ?? t.order ?? 0,
              priority: t.priority || 'medium',
              tags: t.tags || [],
              status: t.status || 'active',
              creatorId: t.createdById || t.createdBy?.id || t.createdBy,
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
    } catch (error) {
      console.error('[useStore] fetchBoard failed:', error);
    } finally {
      set({ isLoadingBoard: false });
    }
  },

  createBoard: async (title, color, memberIds = []) => {
    try {
      const response = await boardsApi.create({ name: title, description: '', color, memberIds });
      const created = response.board || response;
      const mappedBoard: Board = {
        id: created.id || created._id,
        title: created.name || created.title || title,
        description: created.description || '',
        color: created.color || color,
        createdAt: created.createdAt || new Date().toISOString(),
        updatedAt: created.updatedAt || new Date().toISOString(),
        ownerId: created.ownerId || get().currentUser?.id || '',
        memberIds: (created.members || []).map((m: any) => m.userId || m.id || m),
        taskCount: 0,
        lists: 0,
      };

      // set((state) => ({ boards: [...state.boards, mappedBoard] }));

      get().addActivity({
        type: 'task_created',
        message: `created board "${title}"`,
        userId: get().currentUser?.id || '',
        boardId: mappedBoard.id,
      });
      toast.success(`Board "${title}" created!`);
    } catch (error: any) {
      console.error('[useStore] createBoard failed:', error);
      toast.error(error.message || 'Failed to create board');
    }
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
    // Prevent creating lists on temporary boards until they are fully synced
    if (boardId.startsWith('board-') && boardId.includes('-', 6)) {
      toast.error('Please wait for the board to finish creating...');
      return;
    }
    const lists = get().lists.filter((l) => l.boardId === boardId);
    const newList: List = {
      id: generateId('list'),
      title,
      boardId,
      order: lists.length,
      taskIds: [],
    };

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

  createTask: (listId, boardId, title, extraData = {}) => {
    const list = get().lists.find((l) => l.id === listId);
    const position = list?.taskIds.length || 0;

    const newTask: Task = {
      id: generateId('task'),
      title,
      description: extraData.description || '',
      assignees: extraData.assignees || [],
      listId,
      boardId,
      createdAt: new Date().toISOString(),
      order: position,
      priority: extraData.priority || 'medium',
      tags: extraData.tags || [],
      status: 'active',
      creatorId: get().currentUser?.id || '1',
      comments: [],
    };

    set((state) => ({
      tasks: [...state.tasks, newTask],
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, taskIds: [...l.taskIds, newTask.id] } : l
      ),
    }));

    const apiData = {
      title,
      description: extraData.description,
      position,
      cid: newTask.id,
      priority: extraData.priority,
      dueDate: extraData.dueDate,
    };

    tasksApi.create(listId, apiData)
      .then(async (response) => {
        const created = response.task || response;
        if (created.id || created._id) {
          const realId = created.id || created._id;

          // Assign users to the task on the backend
          const assignees = extraData.assignees || [];
          for (const userId of assignees) {
            try {
              await tasksApi.assign(realId, userId);
            } catch (err) {
              console.error(`[useStore] Failed to assign user ${userId} to task ${realId}:`, err);
            }
          }

          // Re-fetch the task to get the full assignments from the backend
          let mappedAssignees = assignees;
          try {
            const taskResponse = await tasksApi.get(realId);
            const fullTask = taskResponse.task || taskResponse;
            mappedAssignees = (fullTask.assignments || fullTask.assignees || []).map((a: any) =>
              typeof a === 'string' ? a : (a.userId || a.user?.id || a.user?._id || a.id)
            );
          } catch {
            // Fall back to original assignees array
          }

          set((state) => {
            // Defensive: Check if realId already exists (e.g. from socket)
            if (state.tasks.some(t => t.id === realId)) {
              // Duplicate real task already exists, just remove the optimistic one
              return {
                tasks: state.tasks.filter((t) => t.id !== newTask.id),
                lists: state.lists.map((l) =>
                  l.id === listId
                    ? { ...l, taskIds: l.taskIds.filter((tid) => tid !== newTask.id) }
                    : l
                ),
              };
            }

            // Otherwise, update the optimistic task
            return {
              tasks: state.tasks.map((t) =>
                t.id === newTask.id
                  ? { ...t, id: realId, assignees: mappedAssignees, creatorId: created.createdById || created.createdBy?.id || created.createdBy }
                  : t
              ),
              lists: state.lists.map((l) =>
                l.id === listId
                  ? { ...l, taskIds: l.taskIds.map((tid) => tid === newTask.id ? realId : tid) }
                  : l
              ),
            };
          });
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
    if (updates.status !== undefined) apiUpdates.status = updates.status;
    if (updates.priority !== undefined) apiUpdates.priority = updates.priority;

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
    // Save state for potential reversal
    const previousTasks = [...get().tasks];
    const previousLists = [...get().lists];

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
          // Ensure newOrder is within bounds
          const safeOrder = Math.max(0, Math.min(newOrder, newTaskIds.length));
          newTaskIds.splice(safeOrder, 0, taskId);
          return { ...l, taskIds: newTaskIds };
        }
        return l;
      }),
    }));

    tasksApi.move(taskId, toListId, newOrder)
      .catch((err) => {
        console.error('[useStore] Task move failed:', err);
        toast.error(err.message || 'Failed to move task');
        // Revert UI state
        set({ tasks: previousTasks, lists: previousLists });
      });

    const taskToMove = get().tasks.find(t => t.id === taskId);
    if (taskToMove) {
      get().addActivity({
        type: 'task_moved',
        message: `moved a task to another list`,
        userId: get().currentUser?.id || '1',
        boardId: taskToMove.boardId,
      });
    }
  },

  deleteTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const currentBoard = get().boards.find(b => b.id === task.boardId);
    const isOwner = get().currentUser?.id === currentBoard?.ownerId;
    const isCreator = get().currentUser?.id === task.creatorId;

    if (!isOwner && !isCreator) {
      toast.error('You do not have permission to delete this task');
      return;
    }

    // Save previous state to revert if needed
    const previousTasks = [...get().tasks];
    const previousLists = [...get().lists];

    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      lists: state.lists.map((l) =>
        l.id === task.listId
          ? { ...l, taskIds: l.taskIds.filter((tid) => tid !== id) }
          : l
      ),
    }));

    tasksApi.delete(id)
      .then(() => {
        toast.success(`Task "${task.title}" deleted`);
      })
      .catch((err) => {
        console.error('[useStore] Failed to delete task:', err);
        toast.error(err.message || 'Failed to delete task');
        // Revert
        set({ tasks: previousTasks, lists: previousLists });
      });
  },

  toggleTaskComplete: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus: TaskStatus = task.status === 'active' ? 'completed' : 'active';
    get().updateTask(id, { status: newStatus });
  },

  addComment: async (taskId, content) => {
    try {
      const response = await commentsApi.create(taskId, content);
      const { comment } = response;

      const mappedComment: Comment = {
        id: comment.id || comment._id,
        taskId: taskId,
        userId: comment.userId,
        userName: comment.user?.username || comment.user?.name,
        userAvatar: (comment.user?.username || comment.user?.name || '')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        content: comment.content,
        createdAt: comment.createdAt,
      };

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? { ...t, comments: [...(t.comments || []), mappedComment] }
            : t
        ),
      }));
    } catch (error: any) {
      console.error('[useStore] addComment failed:', error);
      toast.error(error.message || 'Failed to add comment');
    }
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

  onTaskCreated: (data) => {
    const t = data.task || data;
    const cid = data.cid; // Correctly get cid from data

    const newTask: Task = {
      id: t.id || t._id,
      title: t.title,
      description: t.description || '',
      assignees: (t.assignments || t.assignees || []).map((a: any) =>
        typeof a === 'string' ? a : (a.userId || a.user?.id || a.user?._id || a.id)
      ),
      dueDate: t.dueDate,
      listId: t.listId,
      boardId: t.boardId || t.list?.boardId || (get().lists.find(l => l.id === t.listId)?.boardId || ''),
      createdAt: t.createdAt,
      order: t.position ?? t.order ?? 0,
      priority: t.priority as Priority,
      tags: t.tags || [],
      status: t.status as TaskStatus,
      creatorId: t.createdById || t.createdBy?.id || t.createdBy,
      comments: (t.comments || []).map((c: any) => ({
        id: c.id || c._id,
        taskId: c.taskId || t.id || t._id,
        userId: c.userId || c.user?.id || c.user?._id,
        content: c.content,
        createdAt: c.createdAt,
      })),
    };

    set((state) => {
      // Deduplicate: if a task with this ID already exists, don't add it again
      if (state.tasks.some(task => task.id === newTask.id)) return state;

      // If a task with the client-side ID (cid) exists, replace it with the new task
      const existingTaskIndex = state.tasks.findIndex(task => task.id === cid);
      if (existingTaskIndex !== -1) {
        const updatedTasks = [...state.tasks];
        const oldId = updatedTasks[existingTaskIndex].id;
        updatedTasks[existingTaskIndex] = newTask;

        return {
          tasks: updatedTasks,
          lists: state.lists.map((l) =>
            l.id === newTask.listId
              ? { ...l, taskIds: l.taskIds.map((tid) => tid === oldId ? newTask.id : tid) }
              : l
          ),
        };
      }

      // Otherwise, add the new task
      return {
        tasks: [...state.tasks, newTask],
        lists: state.lists.map((l) =>
          l.id === newTask.listId ? { ...l, taskIds: [...l.taskIds, newTask.id] } : l
        ),
      };
    });
  },

  onTaskUpdated: (data) => {
    const t = data.task || data;
    const taskId = t.id || t._id;
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
            ...task,
            ...t,
            id: taskId,
            assignees: (t.assignments || t.assignees || []).map((a: any) =>
              typeof a === 'string' ? a : (a.userId || a.user?.id || a.user?._id || a.id)
            ),
            creatorId: t.createdById || t.createdBy?.id || t.createdBy || task.creatorId,
          }
          : task
      ),
    }));
  },

  onTaskDeleted: (taskId, listId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, taskIds: l.taskIds.filter((id) => id !== taskId) } : l
      ),
    }));
  },

  onTaskMoved: (taskId, oldListId, newListId, newPosition, data) => {
    const t = data.task || data;
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, listId: newListId, order: newPosition, ...t } : task
      ),
      lists: state.lists.map((l) => {
        if (l.id === oldListId) {
          return { ...l, taskIds: l.taskIds.filter((id) => id !== taskId) };
        }
        if (l.id === newListId) {
          const newTaskIds = l.taskIds.filter((id) => id !== taskId);
          newTaskIds.splice(newPosition, 0, taskId);
          return { ...l, taskIds: newTaskIds };
        }
        return l;
      }),
    }));
  },

  onTaskAssigned: (taskId, userId, _assignment) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, assignees: Array.from(new Set([...(t.assignees || []), userId])) }
          : t
      ),
    }));
  },

  onTaskUnassigned: (taskId, userId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, assignees: (t.assignees || []).filter((id) => id !== userId) }
          : t
      ),
    }));
  },

  onListCreated: (data) => {
    const l = data.list || data;
    const newList: List = {
      id: l.id || l._id,
      title: l.title || l.name,
      boardId: l.boardId,
      order: l.position ?? l.order ?? 0,
      taskIds: (l.tasks || []).map((t: any) => t.id || t._id),
    };
    set((state) => {
      if (state.lists.some(list => list.id === newList.id)) return state;
      return {
        lists: [...state.lists, newList].sort((a, b) => a.order - b.order),
      };
    });
  },

  onListUpdated: (data) => {
    const l = data.list || data;
    const listId = l.id || l._id;
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, ...l, id: listId, title: l.title || l.name || list.title } : list
      ).sort((a, b) => a.order - b.order),
    }));
  },

  onListDeleted: (listId) => {
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== listId),
      tasks: state.tasks.filter((t) => t.listId !== listId),
    }));
  },

  onBoardUpdated: (data) => {
    const b = data.board || data;
    const boardId = b.id || b._id;
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId ? { ...board, ...b, id: boardId, title: b.title || b.name || board.title } : board
      ),
    }));
  },

  onBoardCreated: (data) => {
    const b = data.board || data;
    const boardId = b.id || b._id;
    const newBoard: Board = {
      id: boardId,
      title: b.name || b.title,
      description: b.description || '',
      color: b.color || '#6366f1',
      memberIds: (b.members || []).map((m: any) => m.userId || m.id),
      ownerId: b.ownerId,
      createdAt: b.createdAt || new Date().toISOString(),
      updatedAt: b.updatedAt || b.createdAt || new Date().toISOString(),
      taskCount: b.taskCount || 0,
      lists: (b.lists || []).length,
    };

    set((state) => {
      if (state.boards.some((board) => board.id === boardId)) return state;
      return {
        boards: [newBoard, ...state.boards],
      };
    });
  },

  onBoardDeleted: (boardId) => {
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== boardId),
      // Also clear tasks and lists related to this board if they were loaded
      tasks: state.tasks.filter((t) => t.boardId !== boardId),
      lists: state.lists.filter((l) => l.boardId !== boardId),
    }));
  },

  fetchUsers: async () => {
    const now = Date.now();
    if (now - get().lastUsersFetch < 5000) return;

    console.log('[useStore] fetchUsers() called');
    set({ lastUsersFetch: now });
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

  onCommentAdded: (data) => {
    const { comment, taskId } = data;
    const mappedComment: Comment = {
      id: comment.id || comment._id,
      taskId: taskId,
      userId: comment.userId,
      userName: comment.user?.username || comment.user?.name,
      userAvatar: (comment.user?.username || comment.user?.name || '')
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      content: comment.content,
      createdAt: comment.createdAt,
    };

    set((state) => {
      // Deduplicate: if this comment already exists (e.g. from local add), don't add it again
      const task = state.tasks.find(t => t.id === taskId);
      if (task && task.comments?.some(c => c.id === mappedComment.id)) return state;

      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? { ...t, comments: [...(t.comments || []), mappedComment] }
            : t
        ),
      };
    });
  },
}));