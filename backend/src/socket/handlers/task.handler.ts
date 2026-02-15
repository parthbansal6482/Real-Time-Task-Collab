import { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../events';

/**
 * Handle task-related socket events (e.g. user editing indicator).
 * The actual CRUD broadcasts are done from controllers via getIO().
 */
export function registerTaskHandlers(socket: Socket, userId: string, username: string): void {
    /**
     * Client signals that a user started editing a task.
     */
    socket.on(SOCKET_EVENTS.USER_EDITING, ({ taskId, boardId }: { taskId: string; boardId: string }) => {
        if (!taskId || !boardId) return;
        socket.to(`board:${boardId}`).emit(SOCKET_EVENTS.USER_EDITING, {
            taskId,
            userId,
            username,
        });
    });

    /**
     * Client signals that a user stopped editing a task.
     */
    socket.on(SOCKET_EVENTS.USER_STOPPED_EDITING, ({ taskId, boardId }: { taskId: string; boardId: string }) => {
        if (!taskId || !boardId) return;
        socket.to(`board:${boardId}`).emit(SOCKET_EVENTS.USER_STOPPED_EDITING, {
            taskId,
            userId,
        });
    });
}
