import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError,
  ValidationError 
} from '../utils/errors.js';

const prisma = new PrismaClient();

class AIController {
  static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Process AI query with user's data context
  static async processQuery(req, res) {
    const { query, context, includeFiles, includeEmails, includeCards } = req.body;
    const userId = req.user.userId;

    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new AuthenticationError('OpenAI API key not configured', 'OPENAI_AUTH_REQUIRED');
      }

      // Gather context data based on user preferences
      const contextData = await this.gatherContextData(userId, {
        context,
        includeFiles,
        includeEmails,
        includeCards
      });

      // Build the prompt with context
      const prompt = this.buildPrompt(query, contextData);

      // Call OpenAI API
      let aiResponse;
      try {
        const completion = await AIController.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that answers questions based on the user\'s Google Drive files, Gmail messages, and Trello cards. Only use the provided context data to answer questions. If the information is not available in the context, say so clearly.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        });

        aiResponse = completion.choices[0].message.content;
      } catch (error) {
        throw new ExternalServiceError('OpenAI', error.message, error);
      }

      // Log the query for analytics (optional)
      try {
        await AIController.logQuery(userId, query, aiResponse, contextData.summary);
      } catch (logError) {
        console.warn('Failed to log AI query:', logError.message);
        // Don't fail the request if logging fails
      }

      res.json({
        success: true,
        data: {
          query,
          response: aiResponse,
          contextUsed: contextData.summary,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to process AI query', 'processQuery', error);
      }
      throw error;
    }
  }

  // Gather relevant context data for the AI query
  static async gatherContextData(userId, options) {
    const { context, includeFiles, includeEmails, includeCards } = options;
    const contextData = {
      files: [],
      emails: [],
      cards: [],
      summary: {
        filesCount: 0,
        emailsCount: 0,
        cardsCount: 0,
        totalItems: 0
      }
    };

    try {
      // Gather files if requested
      if ((context === 'all' || context === 'drive') && includeFiles) {
        const files = await prisma.file.findMany({
          where: { userId },
          take: 50, // Limit to avoid token limits
          orderBy: { modifiedAt: 'desc' },
          select: {
            name: true,
            mimeType: true,
            size: true,
            modifiedAt: true,
            webViewLink: true
          }
        });
        contextData.files = files;
        contextData.summary.filesCount = files.length;
      }

      // Gather emails if requested
      if ((context === 'all' || context === 'gmail') && includeEmails) {
        const emails = await prisma.email.findMany({
          where: { userId },
          take: 30, // Limit to avoid token limits
          orderBy: { receivedAt: 'desc' },
          select: {
            subject: true,
            sender: true,
            recipient: true,
            receivedAt: true
          }
        });
        contextData.emails = emails;
        contextData.summary.emailsCount = emails.length;
      }

      // Gather cards if requested
      if ((context === 'all' || context === 'trello') && includeCards) {
        const cards = await prisma.trelloCard.findMany({
          where: { userId },
          take: 40, // Limit to avoid token limits
          orderBy: { createdAt: 'desc' },
          select: {
            name: true,
            description: true,
            dueDate: true,
            url: true,
            board: {
              select: {
                name: true
              }
            }
          }
        });
        contextData.cards = cards;
        contextData.summary.cardsCount = cards.length;
      }

      contextData.summary.totalItems = 
        contextData.summary.filesCount + 
        contextData.summary.emailsCount + 
        contextData.summary.cardsCount;

      return contextData;

    } catch (error) {
      throw new DatabaseError('Failed to gather context data', 'gatherContextData', error);
    }
  }

  // Build the prompt with context data
  static buildPrompt(query, contextData) {
    let prompt = `User Question: ${query}\n\nContext Data:\n`;

    // Add files context
    if (contextData.files.length > 0) {
      prompt += `\nGoogle Drive Files (${contextData.files.length} items):\n`;
      contextData.files.forEach((file, index) => {
        prompt += `${index + 1}. ${file.name} (${file.mimeType}) - Modified: ${file.modifiedAt}\n`;
      });
    }

    // Add emails context
    if (contextData.emails.length > 0) {
      prompt += `\nGmail Messages (${contextData.emails.length} items):\n`;
      contextData.emails.forEach((email, index) => {
        prompt += `${index + 1}. From: ${email.sender} - Subject: ${email.subject} - Date: ${email.receivedAt}\n`;
      });
    }

    // Add cards context
    if (contextData.cards.length > 0) {
      prompt += `\nTrello Cards (${contextData.cards.length} items):\n`;
      contextData.cards.forEach((card, index) => {
        const dueDate = card.dueDate ? ` - Due: ${card.dueDate}` : '';
        const description = card.description ? ` - ${card.description.substring(0, 100)}...` : '';
        prompt += `${index + 1}. ${card.name} (Board: ${card.board.name})${dueDate}${description}\n`;
      });
    }

    if (contextData.summary.totalItems === 0) {
      prompt += '\nNo relevant data found in your Google Drive, Gmail, or Trello.\n';
    }

    prompt += '\nPlease answer the question based only on the context data provided above. If the information needed to answer the question is not available in the context, please say so clearly.';

    return prompt;
  }

  // Log AI queries for analytics and debugging
  static async logQuery(userId, query, response, contextSummary) {
    try {
      // You might want to create a separate table for AI query logs
      // For now, we'll just log to console in a structured way
      const logEntry = {
        timestamp: new Date().toISOString(),
        userId,
        query: query.substring(0, 500), // Truncate long queries
        responseLength: response.length,
        contextSummary,
        success: true
      };

      console.log('AI Query Log:', JSON.stringify(logEntry, null, 2));

      // TODO: Implement proper logging to database or external service
      // await prisma.aiQueryLog.create({
      //   data: {
      //     userId,
      //     query: query.substring(0, 1000),
      //     response: response.substring(0, 2000),
      //     contextSummary: JSON.stringify(contextSummary),
      //     createdAt: new Date()
      //   }
      // });

    } catch (error) {
      console.error('Failed to log AI query:', error);
      // Don't throw error - logging failure shouldn't break the main functionality
    }
  }

  // Get AI query history (placeholder for future implementation)
  static async getQueryHistory(req, res) {
    const { page, limit } = req.query;
    const userId = req.user.userId;

    try {
      // TODO: Implement when AI query logging table is created
      res.json({
        success: true,
        data: {
          queries: [],
          message: 'Query history feature coming soon'
        },
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });

    } catch (error) {
      throw new DatabaseError('Failed to retrieve query history', 'getQueryHistory', error);
    }
  }

  // Get AI usage statistics
  static async getUsageStats(req, res) {
    const userId = req.user.userId;

    try {
      // Get basic stats about user's data
      const [filesCount, emailsCount, cardsCount] = await Promise.all([
        prisma.file.count({ where: { userId } }),
        prisma.email.count({ where: { userId } }),
        prisma.trelloCard.count({ where: { userId } })
      ]);

      const stats = {
        dataAvailable: {
          files: filesCount,
          emails: emailsCount,
          cards: cardsCount,
          total: filesCount + emailsCount + cardsCount
        },
        aiFeatures: {
          queryProcessing: !!process.env.OPENAI_API_KEY,
          contextSearch: true,
          multiSourceAnalysis: true
        },
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to retrieve usage stats', 'getUsageStats', error);
      }
      throw error;
    }
  }
}

export default AIController;
