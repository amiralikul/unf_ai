/**
 * Update Gmail message metadata in database
 * Functional approach to updating Gmail message status
 */

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js';

/**
 * Factory function that creates the updateMessage controller
 * 
 * @param {object} googleOAuth - Google OAuth service instance
 * @param {object} prisma - Prisma client instance
 * @returns {Function} updateMessage controller function
 */
const updateMessageController = (googleOAuth, prisma) => {
  /**
   * Update message metadata
   * 
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  return async (req, res) => {
    try {
      const { messageId } = req.params;
      const { subject } = req.body;
      const userId = req.user.userId;

      // Validate messageId parameter
      if (!messageId || typeof messageId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid message ID format',
          code: 'INVALID_MESSAGE_ID'
        });
      }

      // Validate subject field
      if (subject !== undefined && (typeof subject !== 'string' || subject.length > 255)) {
        return res.status(400).json({
          success: false,
          error: 'Subject must be a string with max 255 characters',
          code: 'INVALID_SUBJECT'
        });
      }

      // Check if message exists and user owns it
      const existingMessage = await prisma.email.findUnique({
        where: {
          google_id: messageId
        }
      });

      if (!existingMessage) {
        return res.status(404).json({
          success: false,
          error: 'Message not found',
          code: 'MESSAGE_NOT_FOUND'
        });
      }

      // Verify user ownership
      if (existingMessage.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this message',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Prepare update data
      const updateData = {};
      if (subject !== undefined) {
        updateData.subject = subject;
      }

      // If no valid fields to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No subject provided for update',
          code: 'NO_UPDATE_FIELDS'
        });
      }

      // Update message in database
      const updatedMessage = await prisma.email.update({
        where: {
          id: existingMessage.id
        },
        data: updateData
      });

      return res.json({
        success: true,
        data: updatedMessage,
        message: 'Message updated successfully'
      });

    } catch (error) {
      console.error('Error updating message:', error);

      // Handle Prisma specific errors
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            success: false,
            error: 'Message not found',
            code: 'MESSAGE_NOT_FOUND'
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error while updating message',
        code: 'UPDATE_MESSAGE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

export default updateMessageController; 