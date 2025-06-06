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
    // Get Gmail client
    const gmailClient = await googleOAuth.getGmailClient(userId);
    
    if (!gmailClient) {
      throw new AuthenticationError('Gmail authentication required', 'GMAIL_AUTH_REQUIRED');
    }

    // Fetch messages from Gmail
    let gmailMessages;
    try {
      const response = await gmailClient.users.messages.list({
        userId: 'me',
        maxResults: 100,
        q: 'is:important OR is:unread'
      });
      
      const messageIds = response.data.messages || [];
      gmailMessages = [];
      
      // Fetch full message details for each message ID
      for (const messageRef of messageIds) {
        const messageResponse = await gmailClient.users.messages.get({
          userId: 'me',
          id: messageRef.id,
          format: 'full'
        });
        
        gmailMessages.push(messageResponse.data);
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
          // Extract message details
          const headers = message.payload.headers;
          const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
          const from = headers.find(h => h.name === 'From')?.value || '';
          const to = headers.find(h => h.name === 'To')?.value || '';
          const date = headers.find(h => h.name === 'Date')?.value || '';
          const receivedAt = date ? new Date(date) : new Date();
          const snippet = message.snippet || '';
          const isUnread = message.labelIds?.includes('UNREAD') || false;
          const isImportant = message.labelIds?.includes('IMPORTANT') || false;
          
          // Check if message exists
          const existingMessage = await tx.message.findUnique({
            where: { gmailId: message.id }
          });
          
          // Save or update message
          const savedMessage = await tx.message.upsert({
            where: { gmailId: message.id },
            update: {
              subject,
              from,
              to,
              snippet,
              receivedAt,
              isRead: !isUnread,
              isImportant
            },
            create: {
              gmailId: message.id,
              subject,
              from,
              to,
              snippet,
              receivedAt,
              isRead: !isUnread,
              isImportant,
              userId
            },
          });
          
          // Process labels
          if (message.labelIds && message.labelIds.length > 0) {
            // First, remove existing labels
            await tx.messageLabel.deleteMany({
              where: { messageId: savedMessage.id }
            });
            
            // Then add current labels
            for (const labelId of message.labelIds) {
              // Find or create label
              const label = await tx.label.upsert({
                where: { gmailId: labelId },
                update: {},
                create: {
                  gmailId: labelId,
                  name: labelId.toLowerCase(),
                  userId
                }
              });
              
              // Connect label to message
              await tx.messageLabel.create({
                data: {
                  message: { connect: { id: savedMessage.id } },
                  label: { connect: { id: label.id } }
                }
              });
            }
          }
          
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
