/**
 * Delete Gmail message from database
 * Functional approach to deleting Gmail messages with related cleanup
 */

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library.js";

/**
 * Factory function that creates the deleteMessage controller
 *
 * @param {object} googleOAuth - Google OAuth service instance
 * @param {object} prisma - Prisma client instance
 * @returns {Function} deleteMessage controller function
 */
const deleteMessageController = (googleOAuth, prisma) => {
  /**
   * Delete message from database
   *
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  return async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user.userId;

      // Validate messageId parameter
      if (!messageId || typeof messageId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid message ID format",
          code: "INVALID_MESSAGE_ID"
        });
      }

      // Check if message exists and user owns it
      const existingMessage = await prisma.email.findUnique({
        where: {
          google_id: messageId
        },
        include: {
          // Include related data to check what will be affected
          attachments: true,
          card_links: true
        }
      });

      if (!existingMessage) {
        return res.status(404).json({
          success: false,
          error: "Message not found",
          code: "MESSAGE_NOT_FOUND"
        });
      }

      // Verify user ownership
      if (existingMessage.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: "You do not have permission to delete this message",
          code: "INSUFFICIENT_PERMISSIONS"
        });
      }

      // Get user tokens to delete from Gmail
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          google_access_token: true,
          google_refresh_token: true
        }
      });

      if (!user || !user.google_access_token) {
        return res.status(400).json({
          success: false,
          error: "Gmail authentication required to delete message",
          code: "GMAIL_AUTH_REQUIRED"
        });
      }

      const tokens = {
        access_token: user.google_access_token,
        refresh_token: user.google_refresh_token
      };

      // Delete from Gmail first
      try {
        await googleOAuth.deleteGmailMessage(tokens, existingMessage.google_id);
      } catch (gmailError) {
        console.error("Error deleting from Gmail:", gmailError);
        return res.status(500).json({
          success: false,
          error: "Failed to delete message from Gmail",
          code: "GMAIL_DELETE_ERROR",
          details: process.env.NODE_ENV === "development" ? gmailError.message : undefined
        });
      }

      // Use transaction to ensure all related data is cleaned up
      const result = await prisma.$transaction(async tx => {
        // Delete related email file links
        await tx.emailFileLink.deleteMany({
          where: {
            email_id: existingMessage.id
          }
        });

        // Delete related trello card links
        await tx.trelloCardEmailLink.deleteMany({
          where: {
            email_id: existingMessage.id
          }
        });

        // Delete the message itself
        const deletedMessage = await tx.email.delete({
          where: {
            id: existingMessage.id
          }
        });

        return deletedMessage;
      });

      return res.json({
        success: true,
        data: {
          id: result.id,
          subject: result.subject,
          deletedAt: new Date().toISOString()
        },
        message: "Message deleted successfully",
        meta: {
          relatedItemsDeleted: {
            emailFileLinks: existingMessage.attachments?.length || 0,
            trelloCardLinks: existingMessage.card_links?.length || 0
          }
        }
      });
    } catch (error) {
      console.error("Error deleting message:", error);

      // Handle Prisma specific errors
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return res.status(404).json({
            success: false,
            error: "Message not found or already deleted",
            code: "MESSAGE_NOT_FOUND"
          });
        }

        if (error.code === "P2003") {
          return res.status(409).json({
            success: false,
            error: "Cannot delete message due to foreign key constraints",
            code: "DELETE_CONSTRAINT_ERROR"
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: "Internal server error while deleting message",
        code: "DELETE_MESSAGE_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  };
};

export default deleteMessageController;
