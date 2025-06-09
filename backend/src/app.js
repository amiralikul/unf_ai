import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './api/auth.js';
import driveRoutes from './api/drive.js';
import gmailRoutes from './api/gmail.js';
import trelloRoutes from './api/trello.js';
import aiRoutes from './api/ai.js';
import linksRoutes from './api/links.js';

// Import middleware
import {
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
  requestLogger
} from './middleware/errorHandler.js';

// Import services
import sessionService from './services/SessionService.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Middleware
app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const activeSessions = await sessionService.getSessionCount();
    const dbStatus = await prisma.$queryRaw`SELECT 1 as test`;

    res.json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        sessions: 'active'
      },
      activeSessions
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/trello', trelloRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/links', linksRoutes);

// Debug endpoint (remove in production)
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/sessions', async (req, res) => {
    try {
      const { sessionId } = req.cookies;
      const session = await sessionService.getSession(sessionId);

      res.json({
        success: true,
        data: {
          hasSessionCookie: !!sessionId,
          sessionId: sessionId ? `${sessionId.substring(0, 10)}...` : 'none',
          sessionExistsInStore: !!session,
          sessionData: session ? { email: session.email, userId: session.userId } : null,
          totalSessions: await sessionService.getSessionCount()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get debug info'
      });
    }
  });
}

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);

  try {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();

    console.log('🔐 Shutting down session service...');
    await sessionService.shutdown();

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

const server = app.listen(port, () => {
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔍 Debug mode: ${process.env.NODE_ENV !== 'production' ? 'enabled' : 'disabled'}`);
});

export default app;