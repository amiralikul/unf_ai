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
    const message = await prisma.message.findFirst({
      where: {
        gmailId: messageId,
        userId
      },
      include: {
        labels: true
      }
    });

    // Check if message exists
    if (!message) {
      throw new NotFoundError('Message not found or access denied', 'MESSAGE_NOT_FOUND');
    }

    // Transform response to match frontend expectations
    const transformedMessage = {
      ...message,
      id: message.gmailId, // Frontend expects 'id' field
      labelNames: message.labels.map(label => label.name)
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
