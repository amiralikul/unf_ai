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
    
    // Add filter logic based on the filter parameter
    if (filter === 'recent') {
      // Show emails from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      whereClause.receivedAt = { gte: sevenDaysAgo };
    } else if (filter === 'unread') {
      // Show only unread emails
      whereClause.isRead = false;
    } else if (filter === 'important') {
      // Show only important emails
      whereClause.isImportant = true;
    }
    
    // Get paginated results from database (handle search with raw SQL for SQLite compatibility)
    let messages, total;
    
    if (search) {
      // For search queries, use raw SQL to support case-insensitive search in SQLite
      const searchPattern = `%${search.toLowerCase()}%`;
      const baseWhereConditions = [];
      const baseParams = [];
      
      // Add base conditions
      baseWhereConditions.push('userId = ?');
      baseParams.push(userId);
      
      // Add filter conditions if any
      if (filter === 'recent') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        baseWhereConditions.push('receivedAt >= ?');
        baseParams.push(sevenDaysAgo.toISOString());
      } else if (filter === 'unread') {
        baseWhereConditions.push('isRead = ?');
        baseParams.push(false);
      } else if (filter === 'important') {
        baseWhereConditions.push('isImportant = ?');
        baseParams.push(true);
      }
      
      const baseWhere = baseWhereConditions.join(' AND ');
      
      // Build search query with case-insensitive LIKE
      const searchQuery = `
        SELECT * FROM "Email" 
        WHERE ${baseWhere} AND (LOWER(subject) LIKE ? OR LOWER(COALESCE(body, '')) LIKE ? OR LOWER(sender) LIKE ?)
        ORDER BY receivedAt DESC
        LIMIT ? OFFSET ?
      `;
      
      const countQuery = `
        SELECT COUNT(*) as count FROM "Email" 
        WHERE ${baseWhere} AND (LOWER(subject) LIKE ? OR LOWER(COALESCE(body, '')) LIKE ? OR LOWER(sender) LIKE ?)
      `;
      
      const searchParams = [...baseParams, searchPattern, searchPattern, searchPattern];
      
      [messages, total] = await Promise.all([
        prisma.$queryRawUnsafe(searchQuery, ...searchParams, pagination.limit, pagination.skip),
        prisma.$queryRawUnsafe(countQuery, ...searchParams).then(result => Number(result[0].count))
      ]);
    } else {
      // For non-search queries, use regular Prisma queries
      [messages, total] = await Promise.all([
        prisma.email.findMany({
          where: whereClause,
          skip: pagination.skip,
          take: pagination.limit,
          orderBy: { receivedAt: 'desc' }
        }),
        prisma.email.count({ where: whereClause })
      ]);
    }

    // Calculate pagination metadata
    const paginationMeta = getPaginationMeta(total, pagination.page, pagination.limit);

    // Transform response to match frontend expectations
    const transformedMessages = messages.map(message => ({
      ...message,
      id: message.googleId, // Frontend expects 'id' field
      gmailId: message.googleId, // For backward compatibility
      from: message.sender,
      to: message.recipient,
      isRead: message.isRead,
      isImportant: message.isImportant,
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
