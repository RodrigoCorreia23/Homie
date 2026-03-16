import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env';

let io: Server;

interface AuthSocket extends Socket {
  userId?: string;
}

export function initSocket(httpServer: HttpServer): void {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Auth middleware
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    const userId = socket.userId!;
    socket.join(`user:${userId}`);
    console.log(`User connected: ${userId}`);

    // Chat room management
    socket.on('chat:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('chat:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('chat:typing', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        conversationId,
        userId,
      });
    });

    socket.on('chat:stopTyping', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('chat:stopTyping', {
        conversationId,
        userId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
