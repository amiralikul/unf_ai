import { sendSuccess } from "../../utils/responses.js";
import { getPaginationParams, getPaginationMeta } from "../../utils/pagination.js";
import { AuthenticationError, ExternalServiceError, DatabaseError } from "../../utils/errors.js";

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
    const whereClause = { user_id: userId };

    // Add filter logic based on the filter parameter
    if (filter === "recent") {
      // Show emails from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      whereClause.received_at = { gte: sevenDaysAgo };
    } else if (filter === "unread") {
      // Show only unread emails
      whereClause.is_read = false;
    } else if (filter === "important") {
      // Show only important emails
      whereClause.is_important = true;
    }

    // Add search filter if provided (PostgreSQL supports case-insensitive search natively)
    if (search) {
      whereClause.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
        { sender_name: { contains: search, mode: "insensitive" } },
        { sender_email: { contains: search, mode: "insensitive" } }
      ];
    }

    // Get paginated results from database
    const [messages, total] = await Promise.all([
      prisma.email.findMany({
        where: whereClause,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { received_at: "desc" }
      }),
      prisma.email.count({ where: whereClause })
    ]);

    // Calculate pagination metadata
    const paginationMeta = getPaginationMeta(total, pagination.page, pagination.limit);

    // Transform response to match frontend expectations
    const transformedMessages = messages.map(message => ({
      ...message,
      id: message.google_id, // Frontend expects 'id' field
      gmailId: message.google_id, // For backward compatibility
      from: message.sender_email || message.sender, // Fallback to old sender
      to: message.recipient_email || message.recipient, // Fallback to old recipient
      fromName: message.sender_name,
      toName: message.recipient_name,
      isRead: message.is_read,
      isImportant: message.is_important,
      labelNames: [] // Email model doesn't have labels yet
    }));

    // Send response
    sendSuccess(res, { messages: transformedMessages }, paginationMeta);
  } catch (error) {
    if (error.code && error.code.startsWith("P")) {
      throw new DatabaseError("Failed to access messages", "getMessages", error);
    }
    throw error;
  }
};

export default getMessagesController;
