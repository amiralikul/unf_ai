import { PrismaClient } from '@prisma/client';
import GoogleOAuthService from '../services/GoogleOAuthService.js';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError,
  NotFoundError 
} from '../utils/errors.js';

const prisma = new PrismaClient();
const googleOAuth = new GoogleOAuthService();

class GmailController {
  // Get Gmail messages with pagination and filtering
  async getMessages(req, res) {
    const { page, limit, query, labelIds, includeSpamTrash } = req.query;
    const userId = req.user.userId;

    try {
      // Get user with tokens
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.googleAccessToken) {
        throw new AuthenticationError('Google authentication required', 'GOOGLE_AUTH_REQUIRED');
      }

      const tokens = {
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      };

      // Fetch messages from Gmail
      let gmailMessages;
      try {
        gmailMessages = await googleOAuth.getGmailMessages(tokens, limit);
      } catch (error) {
        throw new ExternalServiceError('Gmail', error.message, error);
      }

      // Save/update messages in database with transaction
      const savedMessages = await prisma.$transaction(async (tx) => {
        const results = [];
        
        for (const message of gmailMessages) {
          try {
            const savedMessage = await tx.email.upsert({
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
                userId: userId,
              },
            });
            results.push(savedMessage);
          } catch (dbError) {
            console.warn(`Failed to save message ${message.id}:`, dbError.message);
            // Continue with other messages
          }
        }
        
        return results;
      });

      // Build database query filters
      const whereClause = { userId };
      if (query) {
        whereClause.OR = [
          { subject: { contains: query, mode: 'insensitive' } },
          { sender: { contains: query, mode: 'insensitive' } },
          { recipient: { contains: query, mode: 'insensitive' } }
        ];
      }

      // Get paginated results from database
      const skip = (page - 1) * limit;
      const [messages, total] = await Promise.all([
        prisma.email.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { receivedAt: 'desc' }
        }),
        prisma.email.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: { messages },
        meta: {
          page,
          limit,
          total,
          totalPages,
          synced: savedMessages.length
        }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to access messages', 'getMessages', error);
      }
      throw error;
    }
  }

  // Get a specific message by ID
  async getMessageById(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const message = await prisma.email.findFirst({
        where: { 
          id,
          userId 
        }
      });

      if (!message) {
        throw new NotFoundError('Message not found');
      }

      res.json({
        success: true,
        data: { message }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to retrieve message', 'getMessageById', error);
      }
      throw error;
    }
  }

  // Delete a message (from database only, not from Gmail)
  async deleteMessage(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const message = await prisma.email.findFirst({
        where: { 
          id,
          userId 
        }
      });

      if (!message) {
        throw new NotFoundError('Message not found');
      }

      await prisma.email.delete({
        where: { id }
      });

      res.json({
        success: true,
        data: { message: 'Message deleted from database' }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to delete message', 'deleteMessage', error);
      }
      throw error;
    }
  }

  // Sync messages from Gmail
  async syncMessages(req, res) {
    const userId = req.user.userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.googleAccessToken) {
        throw new AuthenticationError('Google authentication required', 'GOOGLE_AUTH_REQUIRED');
      }

      const tokens = {
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      };

      // Fetch messages from Gmail
      let gmailMessages;
      try {
        gmailMessages = await googleOAuth.getGmailMessages(tokens, 100); // Get more messages for sync
      } catch (error) {
        throw new ExternalServiceError('Gmail', error.message, error);
      }

      // Batch update database
      const syncResults = await prisma.$transaction(async (tx) => {
        let created = 0;
        let updated = 0;
        let errors = 0;

        for (const message of gmailMessages) {
          try {
            const result = await tx.email.upsert({
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
                userId: userId,
              },
            });

            // Check if it was created or updated
            const existingMessage = await tx.email.findUnique({
              where: { googleId: message.id },
              select: { createdAt: true }
            });
            
            if (existingMessage && new Date(existingMessage.createdAt) < new Date(Date.now() - 1000)) {
              updated++;
            } else {
              created++;
            }
          } catch (dbError) {
            console.warn(`Failed to sync message ${message.id}:`, dbError.message);
            errors++;
          }
        }

        return { created, updated, errors, total: gmailMessages.length };
      });

      res.json({
        success: true,
        data: {
          message: 'Messages synced successfully',
          results: syncResults
        }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to sync messages', 'syncMessages', error);
      }
      throw error;
    }
  }

  // Get message threads
  async getThreads(req, res) {
    const { page, limit } = req.query;
    const userId = req.user.userId;

    try {
      const skip = (page - 1) * limit;
      
      // Get unique threads with latest message
      const threads = await prisma.email.groupBy({
        by: ['threadId'],
        where: { 
          userId,
          threadId: { not: null }
        },
        _max: {
          receivedAt: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _max: {
            receivedAt: 'desc'
          }
        },
        skip,
        take: limit
      });

      // Get the latest message for each thread
      const threadsWithMessages = await Promise.all(
        threads.map(async (thread) => {
          const latestMessage = await prisma.email.findFirst({
            where: {
              threadId: thread.threadId,
              userId
            },
            orderBy: { receivedAt: 'desc' }
          });

          return {
            threadId: thread.threadId,
            messageCount: thread._count.id,
            latestMessage,
            lastActivity: thread._max.receivedAt
          };
        })
      );

      const total = await prisma.email.groupBy({
        by: ['threadId'],
        where: { 
          userId,
          threadId: { not: null }
        }
      }).then(result => result.length);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: { threads: threadsWithMessages },
        meta: {
          page,
          limit,
          total,
          totalPages
        }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to retrieve threads', 'getThreads', error);
      }
      throw error;
    }
  }
}

export default new GmailController();
