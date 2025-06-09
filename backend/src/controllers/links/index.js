import { sendSuccess, sendError } from '../../utils/responses.js';
import { ValidationError, DatabaseError } from '../../utils/errors.js';
import { LinkDetectionService } from '../../services/LinkDetectionService.js';

/**
 * Create link management controllers
 * 
 * @param {object} prisma - Prisma client instance
 * @returns {object} Controller functions
 */
export const createLinkControllers = (prisma) => {
  const linkDetectionService = new LinkDetectionService(prisma);

  return {
    // POST /api/links/card-file
    linkCardToFile: async (req, res) => {
      try {
        const { cardId, fileId, linkType = 'reference' } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!cardId || !fileId) {
          throw new ValidationError('cardId and fileId are required');
        }

        // Validate that the card belongs to the user
        const card = await prisma.trelloCard.findFirst({
          where: { id: cardId, user_id: userId }
        });

        if (!card) {
          throw new ValidationError('Card not found or access denied');
        }

        // Validate that the file belongs to the user
        const file = await prisma.file.findFirst({
          where: { id: fileId, user_id: userId }
        });

        if (!file) {
          throw new ValidationError('File not found or access denied');
        }

        // Create the link
        const link = await linkDetectionService.linkCardToFile(cardId, fileId, linkType, userId);

        sendSuccess(res, {
          message: 'Card-file link created successfully',
          data: link
        });

      } catch (error) {
        if (error.code && error.code.startsWith('P')) {
          throw new DatabaseError('Failed to create card-file link', 'linkCardToFile', error);
        }
        throw error;
      }
    },

    // POST /api/links/card-email
    linkCardToEmail: async (req, res) => {
      try {
        const { cardId, emailId, linkType = 'discussion' } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!cardId || !emailId) {
          throw new ValidationError('cardId and emailId are required');
        }

        // Validate that the card belongs to the user
        const card = await prisma.trelloCard.findFirst({
          where: { id: cardId, user_id: userId }
        });

        if (!card) {
          throw new ValidationError('Card not found or access denied');
        }

        // Validate that the email belongs to the user
        const email = await prisma.email.findFirst({
          where: { id: emailId, user_id: userId }
        });

        if (!email) {
          throw new ValidationError('Email not found or access denied');
        }

        // Create the link
        const link = await linkDetectionService.linkCardToEmail(cardId, emailId, linkType, userId);

        sendSuccess(res, {
          message: 'Card-email link created successfully',
          data: link
        });

      } catch (error) {
        if (error.code && error.code.startsWith('P')) {
          throw new DatabaseError('Failed to create card-email link', 'linkCardToEmail', error);
        }
        throw error;
      }
    },

    // DELETE /api/links/card-file/:cardId/:fileId
    unlinkCardFromFile: async (req, res) => {
      try {
        const { cardId, fileId } = req.params;
        const userId = req.user.userId;

        // Validate that the card belongs to the user
        const card = await prisma.trelloCard.findFirst({
          where: { id: cardId, user_id: userId }
        });

        if (!card) {
          throw new ValidationError('Card not found or access denied');
        }

        // Delete the link
        const deletedLink = await prisma.trelloCardFileLink.delete({
          where: {
            card_id_file_id: {
              card_id: cardId,
              file_id: fileId
            }
          }
        });

        sendSuccess(res, {
          message: 'Card-file link removed successfully',
          data: deletedLink
        });

      } catch (error) {
        if (error.code === 'P2025') {
          throw new ValidationError('Link not found');
        }
        if (error.code && error.code.startsWith('P')) {
          throw new DatabaseError('Failed to remove card-file link', 'unlinkCardFromFile', error);
        }
        throw error;
      }
    },

    // DELETE /api/links/card-email/:cardId/:emailId
    unlinkCardFromEmail: async (req, res) => {
      try {
        const { cardId, emailId } = req.params;
        const userId = req.user.userId;

        // Validate that the card belongs to the user
        const card = await prisma.trelloCard.findFirst({
          where: { id: cardId, user_id: userId }
        });

        if (!card) {
          throw new ValidationError('Card not found or access denied');
        }

        // Delete the link
        const deletedLink = await prisma.trelloCardEmailLink.delete({
          where: {
            card_id_email_id: {
              card_id: cardId,
              email_id: emailId
            }
          }
        });

        sendSuccess(res, {
          message: 'Card-email link removed successfully',
          data: deletedLink
        });

      } catch (error) {
        if (error.code === 'P2025') {
          throw new ValidationError('Link not found');
        }
        if (error.code && error.code.startsWith('P')) {
          throw new DatabaseError('Failed to remove card-email link', 'unlinkCardFromEmail', error);
        }
        throw error;
      }
    },

    // GET /api/links/card/:cardId
    getCardLinks: async (req, res) => {
      try {
        const { cardId } = req.params;
        const userId = req.user.userId;

        // Validate that the card belongs to the user
        const card = await prisma.trelloCard.findFirst({
          where: { id: cardId, user_id: userId }
        });

        if (!card) {
          throw new ValidationError('Card not found or access denied');
        }

        // Get all links for the card
        const links = await linkDetectionService.getCardLinks(cardId);

        sendSuccess(res, {
          message: 'Card links retrieved successfully',
          data: {
            card: {
              id: card.id,
              name: card.name,
              description: card.description
            },
            ...links
          }
        });

      } catch (error) {
        if (error.code && error.code.startsWith('P')) {
          throw new DatabaseError('Failed to retrieve card links', 'getCardLinks', error);
        }
        throw error;
      }
    },


  };
};

export default createLinkControllers; 