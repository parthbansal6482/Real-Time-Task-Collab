import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getSocket } from '../services/socket';

/**
 * Handle all real-time WebSocket events and update the Zustand store.
 */
export function useSocketEffects() {
  const {
    isAuthenticated,
    setUserEditing,
    removeUserEditing,
    addActivity,
    addNotification,
  } = useStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    // ── Task Events ───────────────────────────────────────────────

    const handleTaskCreated = (data: any) => {
      const state = useStore.getState();
      const task = {
        id: data.id || data._id,
        title: data.title,
        description: data.description || '',
        assignees: data.assignees || [],
        dueDate: data.dueDate,
        listId: data.listId,
        boardId: data.boardId,
        createdAt: data.createdAt || new Date().toISOString(),
        order: data.position ?? data.order ?? 0,
        priority: data.priority || 'medium',
        tags: data.tags || [],
        status: data.status || 'active',
        comments: data.comments || [],
      };

      // Don't add if already exists (this user created it)
      if (state.tasks.some((t) => t.id === task.id)) return;

      useStore.setState((s) => ({
        tasks: [...s.tasks, task],
        lists: s.lists.map((l) =>
          l.id === task.listId ? { ...l, taskIds: [...l.taskIds, task.id] } : l
        ),
      }));
    };

    const handleTaskUpdated = (data: any) => {
      const taskId = data.id || data._id;
      useStore.setState((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, ...data, id: taskId } : t
        ),
      }));
    };

    const handleTaskDeleted = (data: any) => {
      const taskId = data.id || data._id || data.taskId;
      useStore.setState((s) => ({
        tasks: s.tasks.filter((t) => t.id !== taskId),
        lists: s.lists.map((l) => ({
          ...l,
          taskIds: l.taskIds.filter((tid) => tid !== taskId),
        })),
      }));
    };

    const handleTaskMoved = (data: any) => {
      const { taskId, fromListId, toListId, position } = data;
      useStore.setState((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, listId: toListId, order: position ?? t.order } : t
        ),
        lists: s.lists.map((l) => {
          if (l.id === fromListId) {
            return { ...l, taskIds: l.taskIds.filter((id) => id !== taskId) };
          }
          if (l.id === toListId) {
            const ids = [...l.taskIds];
            ids.splice(position ?? ids.length, 0, taskId);
            return { ...l, taskIds: ids };
          }
          return l;
        }),
      }));
    };

    // ── List Events ───────────────────────────────────────────────

    const handleListCreated = (data: any) => {
      const list = {
        id: data.id || data._id,
        title: data.name || data.title,
        boardId: data.boardId,
        order: data.position ?? data.order ?? 0,
        taskIds: [],
      };

      const state = useStore.getState();
      if (state.lists.some((l) => l.id === list.id)) return;

      useStore.setState((s) => ({
        lists: [...s.lists, list],
      }));
    };

    const handleListUpdated = (data: any) => {
      const listId = data.id || data._id;
      useStore.setState((s) => ({
        lists: s.lists.map((l) =>
          l.id === listId
            ? { ...l, title: data.name || data.title || l.title, order: data.position ?? l.order }
            : l
        ),
      }));
    };

    const handleListDeleted = (data: any) => {
      const listId = data.id || data._id || data.listId;
      useStore.setState((s) => ({
        lists: s.lists.filter((l) => l.id !== listId),
        tasks: s.tasks.filter((t) => t.listId !== listId),
      }));
    };

    // ── Board Events ──────────────────────────────────────────────

    const handleBoardUpdated = (data: any) => {
      const boardId = data.id || data._id;
      useStore.setState((s) => ({
        boards: s.boards.map((b) =>
          b.id === boardId
            ? { ...b, title: data.name || data.title || b.title, updatedAt: data.updatedAt || b.updatedAt }
            : b
        ),
      }));
    };

    // ── Member Events ─────────────────────────────────────────────

    const handleMemberAdded = (data: any) => {
      const { boardId, user } = data;
      if (!user) return;

      const newUser = {
        id: user.id || user._id,
        name: user.username || user.name,
        email: user.email || '',
        avatar: (user.username || user.name || '')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        online: user.online ?? true,
      };

      useStore.setState((s) => ({
        boards: s.boards.map((b) =>
          b.id === boardId ? { ...b, memberIds: [...b.memberIds, newUser.id] } : b
        ),
        users: s.users.some((u) => u.id === newUser.id)
          ? s.users
          : [...s.users, newUser],
      }));
    };

    const handleMemberRemoved = (data: any) => {
      const { boardId, userId } = data;
      useStore.setState((s) => ({
        boards: s.boards.map((b) =>
          b.id === boardId
            ? { ...b, memberIds: b.memberIds.filter((id) => id !== userId) }
            : b
        ),
      }));
    };

    // ── User Presence ─────────────────────────────────────────────

    const handleUserJoined = (data: any) => {
      const userId = data.userId || data.id;
      useStore.setState((s) => ({
        users: s.users.map((u) =>
          u.id === userId ? { ...u, online: true } : u
        ),
      }));
      addNotification({
        title: 'User joined',
        message: `${data.name || 'A user'} has come online`,
        type: 'general',
      });
    };

    const handleUserLeft = (data: any) => {
      const userId = data.userId || data.id;
      useStore.setState((s) => ({
        users: s.users.map((u) =>
          u.id === userId ? { ...u, online: false } : u
        ),
      }));
    };

    // ── Activity ──────────────────────────────────────────────────

    const handleNewActivity = (data: any) => {
      addActivity({
        type: data.type || 'task_updated',
        message: data.message || data.description || '',
        userId: data.userId || data.user?.id || '',
        boardId: data.boardId || '',
      });
    };

    // ── User Editing ──────────────────────────────────────────────

    const handleUserEditing = (data: any) => {
      const { taskId, userId } = data;
      setUserEditing(taskId, userId);
      // Auto-remove after 30s
      setTimeout(() => removeUserEditing(taskId, userId), 30000);
    };

    // ── Register Listeners ────────────────────────────────────────

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('task:moved', handleTaskMoved);
    socket.on('list:created', handleListCreated);
    socket.on('list:updated', handleListUpdated);
    socket.on('list:deleted', handleListDeleted);
    socket.on('board:updated', handleBoardUpdated);
    socket.on('member:added', handleMemberAdded);
    socket.on('member:removed', handleMemberRemoved);
    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);
    socket.on('activity:new', handleNewActivity);
    socket.on('user:editing', handleUserEditing);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('task:moved', handleTaskMoved);
      socket.off('list:created', handleListCreated);
      socket.off('list:updated', handleListUpdated);
      socket.off('list:deleted', handleListDeleted);
      socket.off('board:updated', handleBoardUpdated);
      socket.off('member:added', handleMemberAdded);
      socket.off('member:removed', handleMemberRemoved);
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
      socket.off('activity:new', handleNewActivity);
      socket.off('user:editing', handleUserEditing);
    };
  }, [isAuthenticated, setUserEditing, removeUserEditing, addActivity, addNotification]);
}

/**
 * Global keyboard shortcut handlers.
 */
export function useKeyboardShortcuts() {
  const {
    toggleActivityPanel,
    setSelectedTaskId,
    setSelectedBoardId,
    isSettingsOpen,
    toggleSettings,
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC — close modals and panels
      if (e.key === 'Escape') {
        const state = useStore.getState();
        if (state.selectedTaskId) {
          setSelectedTaskId(null);
        } else if (state.isActivityPanelOpen) {
          toggleActivityPanel();
        } else if (isSettingsOpen) {
          toggleSettings();
        }
      }

      // Cmd/Ctrl + Shift + A — toggle activity panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        toggleActivityPanel();
      }

      // Cmd/Ctrl + K — focus search (handled by GlobalSearch component)
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleActivityPanel, setSelectedTaskId, setSelectedBoardId, isSettingsOpen, toggleSettings]);
}
