import { Socket } from 'socket.io';

/**
 * Handle presence-related events.
 * Currently presence is tracked in board.handler.ts — this module is a placeholder
 * for future presence features (typing indicators, cursor positions, etc.).
 */
export function registerPresenceHandlers(_socket: Socket, _userId: string, _username: string): void {
    // Presence is handled by board handlers (join/leave).
    // Add custom presence events here as needed.
}
