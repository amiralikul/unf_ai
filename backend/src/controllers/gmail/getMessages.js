import { sendSuccess } from '../../utils/responses.js';
import { getPaginationParams, getPaginationMeta } from '../../utils/pagination.js';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError
} from '../../utils/errors.js';

/**
 * Get Gmail messages with pagination and filtering
 * 
 * @param {object} googleOAuth - Google OAuth service instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const getMessagesController = (googleOAuth, prisma) => async (req, res) => {
  const { page = 1, limit = 10, filter, search } = req.query;
  const userId = req.user.userId;
  const pagination = getPaginationParams({ page, limit });

  try {
    // Build database query filters
    const whereClause = { userId };
    
    // Add filter logic if needed (Email model doesn't have read/important flags yet)
    // TODO: Add isRead, isImportant fields to Email model if needed
    if (filter === 'recent') {
      // Show emails from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      whereClause.receivedAt = { gte: sevenDaysAgo };
    }
    
    // Add search logic if provided
    if (search) {
      whereClause.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { sender: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get paginated results from database
    const [messages, total] = await Promise.all([
      prisma.email.findMany({
        where: whereClause,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { receivedAt: 'desc' }
      }),
      prisma.email.count({ where: whereClause })
    ]);

    // Calculate pagination metadata
    const paginationMeta = getPaginationMeta(total, pagination.page, pagination.limit);

    // Transform response to match frontend expectations
    const transformedMessages = messages.map(message => ({
      ...message,
      id: message.googleId, // Frontend expects 'id' field
      gmailId: message.googleId, // For backward compatibility
      from: message.sender,
      to: message.recipient,
      labelNames: [] // Email model doesn't have labels yet
    }));

    // Send response
    sendSuccess(res, 
      { messages: transformedMessages }, 
      paginationMeta
    );

  } catch (error) {
    if (error.code && error.code.startsWith('P')) {
      throw new DatabaseError('Failed to access messages', 'getMessages', error);
    }
    throw error;
  }
};

export default getMessagesController;
