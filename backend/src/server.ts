import http from 'http';
import app from './app';
import { env } from './config/env';
import { initSocket } from './config/socket';
import { prisma } from './config/database';

const server = http.createServer(app);

// ── Initialise Socket.IO ──────────────────────────────────────────
initSocket(server);

// ── Start server ──────────────────────────────────────────────────
async function start() {
    try {
        // Verify database connection
        await prisma.$connect();
        console.log('✅ Database connected');

        server.listen(env.PORT, () => {
            console.log(`
  ┌──────────────────────────────────────────┐
  │  🚀 TaskFlow Backend                     │
  │  Environment : ${env.NODE_ENV.padEnd(24)}│
  │  Port        : ${String(env.PORT).padEnd(24)}│
  │  Database    : Connected                 │
  │  WebSocket   : Ready                     │
  └──────────────────────────────────────────┘
      `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// ── Graceful shutdown ─────────────────────────────────────────────
function shutdown() {
    console.log('\n🔄 Shutting down gracefully...');
    server.close(async () => {
        await prisma.$disconnect();
        console.log('👋 Server stopped');
        process.exit(0);
    });
    // Force shutdown after 10s
    setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();

export { server };
