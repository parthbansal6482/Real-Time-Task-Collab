import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getSocket } from '../services/socket';
import { SOCKET_EVENTS } from '../services/socketEvents';
import { toast } from 'sonner';

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
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onTaskMoved,
    onTaskAssigned,
    onTaskUnassigned,
    onListCreated,
    onListUpdated,
    onListDeleted,
    onBoardUpdated,
    onBoardCreated,
    onBoardDeleted,
    onCommentAdded,
  } = useStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    // ── Task Events ───────────────────────────────────────────────

    const handleTaskCreated = (data: any) => onTaskCreated(data);
    const handleTaskUpdated = (data: any) => onTaskUpdated(data);
    const handleTaskDeleted = (data: any) => onTaskDeleted(data.taskId || data.id, data.listId);
    const handleTaskMoved = (data: any) => {
      onTaskMoved(data.taskId, data.oldListId, data.newListId, data.position, data);
    };
    const handleTaskAssigned = (data: any) => onTaskAssigned(data.taskId, data.userId, data.assignment);
    const handleTaskUnassigned = (data: any) => onTaskUnassigned(data.taskId, data.userId);
    const handleCommentAdded = (data: any) => onCommentAdded(data);

    // ── List Events ───────────────────────────────────────────────

    const handleListCreated = (data: any) => onListCreated(data);
    const handleListUpdated = (data: any) => onListUpdated(data);
    const handleListDeleted = (data: any) => onListDeleted(data.listId || data.id);

    // ── Board Events ──────────────────────────────────────────────

    const handleBoardUpdated = (data: any) => onBoardUpdated(data);
    const handleBoardCreated = (data: any) => onBoardCreated(data);
    const handleBoardDeleted = (data: any) => {
      const boardId = data.boardId || data.id;
      // Remove from store first
      onBoardDeleted(boardId);

      // If the current board is deleted, redirect to dashboard
      const state = useStore.getState();
      if (state.selectedBoardId === boardId) {
        state.setCurrentView('dashboard');
        state.setSelectedBoardId(null);
        toast.info('The board you were viewing has been deleted');
      }
    };

    // ── Member Events ─────────────────────────────────────────────

    const handleMemberAdded = (data: any) => {
      const { boardId, member } = data;
      if (!member) return;

      useStore.setState((s) => ({
        boards: s.boards.map((b) =>
          b.id === boardId ? { ...b, memberIds: [...b.memberIds, member.userId] } : b
        ),
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
        message: `${data.username || data.name || 'A user'} has come online`,
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

    const handleUserStoppedEditing = (data: any) => {
      const { taskId, userId } = data;
      removeUserEditing(taskId, userId);
    };

    // ── Register Listeners ────────────────────────────────────────

    socket.on(SOCKET_EVENTS.TASK_CREATED, handleTaskCreated);
    socket.on(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdated);
    socket.on(SOCKET_EVENTS.TASK_DELETED, handleTaskDeleted);
    socket.on(SOCKET_EVENTS.TASK_MOVED, handleTaskMoved);
    socket.on(SOCKET_EVENTS.TASK_ASSIGNED, handleTaskAssigned);
    socket.on(SOCKET_EVENTS.TASK_UNASSIGNED, handleTaskUnassigned);
    socket.on(SOCKET_EVENTS.COMMENT_ADDED, handleCommentAdded);
    socket.on(SOCKET_EVENTS.LIST_CREATED, handleListCreated);
    socket.on(SOCKET_EVENTS.LIST_UPDATED, handleListUpdated);
    socket.on(SOCKET_EVENTS.LIST_DELETED, handleListDeleted);
    socket.on(SOCKET_EVENTS.BOARD_CREATED, handleBoardCreated);
    socket.on(SOCKET_EVENTS.BOARD_UPDATED, handleBoardUpdated);
    socket.on(SOCKET_EVENTS.BOARD_DELETED, handleBoardDeleted);
    socket.on(SOCKET_EVENTS.MEMBER_ADDED, handleMemberAdded);
    socket.on(SOCKET_EVENTS.MEMBER_REMOVED, handleMemberRemoved);
    socket.on(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
    socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
    socket.on(SOCKET_EVENTS.ACTIVITY_NEW, handleNewActivity);
    socket.on(SOCKET_EVENTS.USER_EDITING, handleUserEditing);
    socket.on(SOCKET_EVENTS.USER_STOPPED_EDITING, handleUserStoppedEditing);

    return () => {
      socket.off(SOCKET_EVENTS.TASK_CREATED, handleTaskCreated);
      socket.off(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdated);
      socket.off(SOCKET_EVENTS.TASK_DELETED, handleTaskDeleted);
      socket.off(SOCKET_EVENTS.TASK_MOVED, handleTaskMoved);
      socket.off(SOCKET_EVENTS.TASK_ASSIGNED, handleTaskAssigned);
      socket.off(SOCKET_EVENTS.TASK_UNASSIGNED, handleTaskUnassigned);
      socket.off(SOCKET_EVENTS.COMMENT_ADDED, handleCommentAdded);
      socket.off(SOCKET_EVENTS.LIST_CREATED, handleListCreated);
      socket.off(SOCKET_EVENTS.LIST_UPDATED, handleListUpdated);
      socket.off(SOCKET_EVENTS.LIST_DELETED, handleListDeleted);
      socket.off(SOCKET_EVENTS.BOARD_CREATED, handleBoardCreated);
      socket.off(SOCKET_EVENTS.BOARD_UPDATED, handleBoardUpdated);
      socket.off(SOCKET_EVENTS.BOARD_DELETED, handleBoardDeleted);
      socket.off(SOCKET_EVENTS.MEMBER_ADDED, handleMemberAdded);
      socket.off(SOCKET_EVENTS.MEMBER_REMOVED, handleMemberRemoved);
      socket.off(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
      socket.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
      socket.off(SOCKET_EVENTS.ACTIVITY_NEW, handleNewActivity);
      socket.off(SOCKET_EVENTS.USER_EDITING, handleUserEditing);
      socket.off(SOCKET_EVENTS.USER_STOPPED_EDITING, handleUserStoppedEditing);
    };
  }, [
    isAuthenticated,
    setUserEditing,
    removeUserEditing,
    addActivity,
    addNotification,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onTaskMoved,
    onTaskAssigned,
    onTaskUnassigned,
    onListCreated,
    onListUpdated,
    onListDeleted,
    onBoardUpdated,
    onBoardCreated,
    onBoardDeleted,
    onCommentAdded,
  ]);
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
