import { Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { prisma } from './database';
import { JwtPayload } from '../types/user.types';
import { registerBoardHandlers } from '../socket/handlers/board.handler';
import { registerTaskHandlers } from '../socket/handlers/task.handler';
import { registerPresenceHandlers } from '../socket/handlers/presence.handler';

let io: IOServer;

/**
 * Initialise Socket.IO with JWT authentication and event handlers.
 */
export function initSocket(httpServer: HttpServer): IOServer {
    io = new IOServer(httpServer, {
        cors: {
            origin: env.CORS_ORIGIN,
            credentials: true,
            methods: ['GET', 'POST'],
        },
        pingInterval: 25000,
        pingTimeout: 20000,
    });

    // ── JWT authentication middleware ───────────────────────────────
    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, username: true },
            });

            if (!user) {
                return next(new Error('User not found'));
            }

            // Attach user info to socket for use in handlers
            (socket as any).userId = user.id;
            (socket as any).username = user.username;

            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    // ── Connection handler ──────────────────────────────────────────
    io.on('connection', (socket) => {
        const userId = (socket as any).userId as string;
        const username = (socket as any).username as string;

        console.log(`🔌 Socket connected: ${username} (${socket.id})`);
        socket.join(`user:${userId}`);

        registerBoardHandlers(socket, userId, username);
        registerTaskHandlers(socket, userId, username);
        registerPresenceHandlers(socket, userId, username);
    });

    return io;
}

/**
 * Get the Socket.IO server instance (for broadcasting from controllers).
 * Falls back to a no-op emitter if socket isn't initialised yet
 * (e.g. during tests).
 */
export function getIO(): IOServer {
    if (!io) {
        // Return a stub so controllers don't crash without a running socket server
        return {
            to: () => ({
                emit: () => { },
            }),
        } as unknown as IOServer;
    }
    return io;
}
