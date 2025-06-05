import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRoutes, { requireAuth } from './api/auth.js';
import GoogleOAuthService from './services/GoogleOAuthService.js';
import sessionService from './services/SessionService.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();
const googleOAuth = new GoogleOAuthService();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeSessions: await sessionService.getSessionCount()
  });
});

// Auth routes
app.use('/auth', authRoutes);

// Debug endpoint (remove in production)
app.get('/debug/sessions', async (req, res) => {
  const { sessionId } = req.cookies;
  const session = await sessionService.getSession(sessionId);
  
  res.json({
    hasSessionCookie: !!sessionId,
    sessionId: sessionId ? `${sessionId.substring(0, 10)}...` : 'none',
    sessionExistsInStore: !!session,
    sessionData: session ? { email: session.email, userId: session.userId } : null,
    totalSessions: await sessionService.getSessionCount()
  });
});

// Protected API Routes
app.get('/api/drive/files', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user?.googleAccessToken) {
      return res.status(401).json({ error: 'Google authentication required' });
    }

    const tokens = {
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    };

    const files = await googleOAuth.getDriveFiles(tokens);
    
    // Save files to database
    const savedFiles = [];
    for (const file of files) {
      try {
        const savedFile = await prisma.file.upsert({
          where: { googleId: file.id },
          update: {
            name: file.name,
            mimeType: file.mimeType,
            size: file.size ? parseInt(file.size) : null,
            webViewLink: file.webViewLink,
            owners: JSON.stringify(file.owners),
            modifiedAt: new Date(file.modifiedTime),
          },
          create: {
            googleId: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size ? parseInt(file.size) : null,
            webViewLink: file.webViewLink,
            owners: JSON.stringify(file.owners),
            modifiedAt: new Date(file.modifiedTime),
            userId: req.user.userId,
          },
        });
        savedFiles.push(savedFile);
      } catch (dbError) {
        console.error('Error saving file:', file.id, dbError);
        // Continue with other files even if one fails
      }
    }

    console.log(`✅ Saved ${savedFiles.length} Drive files to database`);
    res.json({ files: savedFiles });
  } catch (error) {
    console.error('Drive files error:', error);
    res.status(500).json({ error: 'Failed to fetch drive files' });
  }
});

app.get('/api/gmail/messages', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user?.googleAccessToken) {
      return res.status(401).json({ error: 'Google authentication required' });
    }

    const tokens = {
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    };

    const messages = await googleOAuth.getGmailMessages(tokens);
    
    // Save messages to database
    const savedMessages = [];
    for (const message of messages) {
      try {
        const savedMessage = await prisma.email.upsert({
          where: { googleId: message.id },
          update: {
            subject: message.subject,
            sender: message.sender,
            recipient: message.recipient,
            receivedAt: message.receivedAt,
          },
          create: {
            googleId: message.id,
            threadId: message.threadId,
            subject: message.subject,
            sender: message.sender,
            recipient: message.recipient,
            receivedAt: message.receivedAt,
            userId: req.user.userId,
          },
        });
        savedMessages.push(savedMessage);
      } catch (dbError) {
        console.error('Error saving message:', message.id, dbError);
        // Continue with other messages even if one fails
      }
    }

    console.log(`✅ Saved ${savedMessages.length} Gmail messages to database`);
    res.json({ messages: savedMessages });
  } catch (error) {
    console.error('Gmail messages error:', error);
    res.status(500).json({ error: 'Failed to fetch gmail messages' });
  }
});

app.get('/api/trello/boards', requireAuth, (req, res) => {
  res.json({ message: 'Trello boards endpoint - coming soon' });
});

app.post('/api/ai/query', requireAuth, (req, res) => {
  res.json({ message: 'AI query endpoint - coming soon' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  await sessionService.shutdown();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Backend server running on http://localhost:${port}`);
});

export default app; 