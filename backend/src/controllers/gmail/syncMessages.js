import { sendSuccess } from '../../utils/responses.js';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError
} from '../../utils/errors.js';

/**
 * Sync Gmail messages from the API
 * 
 * @param {object} googleOAuth - Google OAuth service instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const syncMessagesController = (googleOAuth, prisma) => async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get user tokens from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        googleAccessToken: true,
        googleRefreshToken: true
      }
    });
    
    if (!user || !user.googleAccessToken) {
      throw new AuthenticationError('Gmail authentication required', 'GMAIL_AUTH_REQUIRED');
    }
    
    // Create tokens object
    const tokens = {
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    };
    
    // Fetch messages from Gmail using the service
    let gmailMessages;
    try {
      // Use the existing getGmailMessages method with a higher limit
      gmailMessages = await googleOAuth.getGmailMessages(tokens, 100);
      
      if (!gmailMessages || gmailMessages.length === 0) {
        // Return early if no messages found
        return sendSuccess(res, {
          message: 'No Gmail messages found to synchronize',
          stats: { total: 0, created: 0, updated: 0, failed: 0 },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      throw new ExternalServiceError('Gmail', error.message, error);
    }

    // Save/update messages in database with transaction
    const syncResults = await prisma.$transaction(async (tx) => {
      const results = {
        total: gmailMessages.length,
        created: 0,
        updated: 0,
        failed: 0
      };
      
      // Process each message
      for (const message of gmailMessages) {
        try {
          // Message details are already extracted by getGmailMessages
          const subject = message.subject || '(No Subject)';
          const from = message.sender || '';
          const to = message.recipient || '';
          const receivedAt = message.receivedAt || new Date();
          // Use values provided by getGmailMessages
          const snippet = message.snippet || '';
          const isUnread = message.isUnread || false;
          const isImportant = message.isImportant || false;
          
          // Check if message exists
          const existingMessage = await tx.email.findUnique({
            where: { googleId: message.id }
          });
          
          // Save or update message
          const savedMessage = await tx.email.upsert({
            where: { googleId: message.id },
            update: {
              subject,
              sender: from,
              recipient: to,
              snippet,
              receivedAt,
              isRead: !isUnread,
              isImportant
            },
            create: {
              googleId: message.id,
              subject,
              sender: from,
              recipient: to,
              snippet,
              receivedAt,
              isRead: !isUnread,
              isImportant,
              userId
            },
          });
          
          // Skip label processing for now as we don't have label data
          // from the getGmailMessages method
          
          if (existingMessage) {
            results.updated++;
          } else {
            results.created++;
          }
        } catch (messageError) {
          console.warn(`Failed to save message ${message.id}:`, messageError.message);
          results.failed++;
        }
      }
      
      return results;
    });

    // Send response
    sendSuccess(res, {
      message: 'Gmail messages synchronized successfully',
      stats: syncResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error.code && error.code.startsWith('P')) {
      throw new DatabaseError('Failed to sync Gmail messages', 'syncMessages', error);
    }
    throw error;
  }
};

export default syncMessagesController;
