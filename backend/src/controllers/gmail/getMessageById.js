import { sendSuccess } from '../../utils/responses.js';
import { 
  NotFoundError, 
  DatabaseError
} from '../../utils/errors.js';

/**
 * Get a specific Gmail message by ID
 * 
 * @param {object} googleOAuth - Google OAuth service instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const getMessageByIdController = (googleOAuth, prisma) => async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId;

  try {
    // Get message from database
    const message = await prisma.email.findFirst({
      where: {
        googleId: messageId,
        userId
      }
    });

    // Check if message exists
    if (!message) {
      throw new NotFoundError('Message not found or access denied', 'MESSAGE_NOT_FOUND');
    }

    // Transform response to match frontend expectations
    const transformedMessage = {
      ...message,
      id: message.googleId, // Frontend expects 'id' field
      gmailId: message.googleId, // For backward compatibility
      from: message.sender,
      to: message.recipient,
      labelNames: [] // Email model doesn't have labels yet
    };

    // Send response
    sendSuccess(res, { message: transformedMessage });

  } catch (error) {
    if (error.code && error.code.startsWith('P')) {
      throw new DatabaseError('Failed to access message', 'getMessageById', error);
    }
    throw error;
  }
};

export default getMessageByIdController;
