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
 * @param {object} linkDetectionService - Link detection service instance
 * @returns {function} Express route handler
 */
export const syncMessagesController = (googleOAuth, prisma, linkDetectionService) => async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get user tokens from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        google_access_token: true,
        google_refresh_token: true
      }
    });
    
    if (!user || !user.google_access_token) {
      throw new AuthenticationError('Gmail authentication required', 'GMAIL_AUTH_REQUIRED');
    }
    
    // Create tokens object
    const tokens = {
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token
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
          stats: { total: 0, created: 0, updated: 0, failed: 0, linksCreated: 0 },
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
        failed: 0,
        linksCreated: 0
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
            where: { google_id: message.id }
          });
          
          // Save or update message
          const savedMessage = await tx.email.upsert({
            where: { google_id: message.id },
            update: {
              subject,
              sender: from,
              recipient: to,
              sender_name: message.senderName,
              sender_email: message.senderEmail,
              recipient_name: message.recipientName,
              recipient_email: message.recipientEmail,
              snippet,
              received_at: receivedAt,
              is_read: !isUnread,
              is_important: isImportant
            },
            create: {
              google_id: message.id,
              subject,
              sender: from,
              recipient: to,
              sender_name: message.senderName,
              sender_email: message.senderEmail,
              recipient_name: message.recipientName,
              recipient_email: message.recipientEmail,
              snippet,
              received_at: receivedAt,
              is_read: !isUnread,
              is_important: isImportant,
              user_id: userId
            },
          });
          
          // Process attachments (enhanced for all Google file types)
          if (message.attachments && message.attachments.length > 0) {
            for (const attachment of message.attachments) {
              if (attachment.fileId) {
                // Find the corresponding file in the database
                const file = await tx.file.findUnique({
                  where: { google_id: attachment.fileId },
                });

                if (file) {
                  // Create the link in the join table
                  await tx.emailFileLink.upsert({
                    where: {
                      email_id_file_id: {
                        email_id: savedMessage.id,
                        file_id: file.id,
                      },
                    },
                    update: {},
                    create: {
                      email_id: savedMessage.id,
                      file_id: file.id,
                    },
                  });
                } else {
                  // Log missing files for potential future sync
                  console.log(`File not found in database: ${attachment.fileId} (${attachment.type})`);
                }
              }
            }
          }

          // Detect Trello card references in email content and create links
          try {
            const emailText = `${subject} ${snippet} ${message.body || ''}`;
            const linkResults = await linkDetectionService.processEmailText(savedMessage.id, emailText, userId);
            results.linksCreated += linkResults.cardLinks.length;
            
            if (linkResults.errors.length > 0) {
              console.warn(`Link detection errors for email ${savedMessage.id}:`, linkResults.errors);
            }
          } catch (linkError) {
            console.warn(`Failed to detect links for email ${savedMessage.id}:`, linkError.message);
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
