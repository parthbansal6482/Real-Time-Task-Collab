import { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../events';

/**
 * Track which users are in which board rooms for presence features.
 * Maps: boardId → Set of { socketId, userId, username }
 */
const boardPresence = new Map<string, Set<{ socketId: string; userId: string; username: string }>>();

/**
 * Handle board room join/leave and user presence.
 */
export function registerBoardHandlers(socket: Socket, userId: string, username: string): void {
    /**
     * Client joins a board room to receive real-time updates.
     */
    socket.on(SOCKET_EVENTS.JOIN_BOARD, ({ boardId }: { boardId: string }) => {
        if (!boardId) return;

        const room = `board:${boardId}`;
        socket.join(room);

        // Track presence
        if (!boardPresence.has(boardId)) {
            boardPresence.set(boardId, new Set());
        }
        const presence = boardPresence.get(boardId)!;
        presence.add({ socketId: socket.id, userId, username });

        // Notify others in the room
        socket.to(room).emit(SOCKET_EVENTS.USER_JOINED, {
            userId,
            username,
            boardId,
        });

        // Send current presence list to the joining user
        const onlineUsers = Array.from(presence).map(({ userId: uid, username: uname }) => ({
            userId: uid,
            username: uname,
        }));
        socket.emit('board:presence', { boardId, users: onlineUsers });

        console.log(`→ ${username} joined board:${boardId}`);
    });

    /**
     * Client leaves a board room.
     */
    socket.on(SOCKET_EVENTS.LEAVE_BOARD, ({ boardId }: { boardId: string }) => {
        if (!boardId) return;
        leaveBoard(socket, boardId, userId, username);
    });

    /**
     * Handle disconnection — clean up all board rooms.
     */
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        for (const [boardId, presence] of boardPresence.entries()) {
            for (const entry of presence) {
                if (entry.socketId === socket.id) {
                    leaveBoard(socket, boardId, userId, username);
                    break;
                }
            }
        }
        console.log(`← ${username} disconnected`);
    });
}

/**
 * Remove a user from a board room and notify others.
 */
function leaveBoard(socket: Socket, boardId: string, userId: string, username: string): void {
    const room = `board:${boardId}`;
    socket.leave(room);

    const presence = boardPresence.get(boardId);
    if (presence) {
        for (const entry of presence) {
            if (entry.socketId === socket.id) {
                presence.delete(entry);
                break;
            }
        }
        if (presence.size === 0) {
            boardPresence.delete(boardId);
        }
    }

    socket.to(room).emit(SOCKET_EVENTS.USER_LEFT, { userId, boardId });
    console.log(`← ${username} left board:${boardId}`);
}

/**
 * Get all users currently in a board room (for API use).
 */
export function getBoardPresence(boardId: string): Array<{ userId: string; username: string }> {
    const presence = boardPresence.get(boardId);
    if (!presence) return [];
    return Array.from(presence).map(({ userId, username }) => ({ userId, username }));
}
