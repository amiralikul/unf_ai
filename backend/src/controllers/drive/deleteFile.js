/**
 * Delete file from database
 * Functional approach to deleting Drive files with related cleanup
 */

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library.js";

/**
 * Factory function that creates the deleteFile controller
 *
 * @param {object} googleOAuth - Google OAuth service instance
 * @param {object} prisma - Prisma client instance
 * @returns {Function} deleteFile controller function
 */
const deleteFileController = (googleOAuth, prisma) => {
  /**
   * Delete file from database
   *
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  return async (req, res) => {
    try {
      const { fileId } = req.params;
      const userId = req.user.userId;

      // Validate fileId parameter
      if (!fileId || typeof fileId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid file ID format",
          code: "INVALID_FILE_ID"
        });
      }

      // Check if file exists and user owns it
      const existingFile = await prisma.file.findUnique({
        where: {
          google_id: fileId
        },
        include: {
          // Include related data to check what will be affected
          emails: true,
          card_links: true
        }
      });

      if (!existingFile) {
        return res.status(404).json({
          success: false,
          error: "File not found",
          code: "FILE_NOT_FOUND"
        });
      }

      // Verify user ownership
      if (existingFile.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: "You do not have permission to delete this file",
          code: "INSUFFICIENT_PERMISSIONS"
        });
      }

      // Get user tokens to delete from Google Drive
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
          error: "Google Drive authentication required to delete file",
          code: "GOOGLE_AUTH_REQUIRED"
        });
      }

      const tokens = {
        access_token: user.google_access_token,
        refresh_token: user.google_refresh_token
      };

      // Delete from Google Drive first
      try {
        await googleOAuth.deleteDriveFile(tokens, existingFile.google_id);
      } catch (driveError) {
        console.error("Error deleting from Google Drive:", driveError);
        return res.status(500).json({
          success: false,
          error: "Failed to delete file from Google Drive",
          code: "DRIVE_DELETE_ERROR",
          details: process.env.NODE_ENV === "development" ? driveError.message : undefined
        });
      }

      // Use transaction to ensure all related data is cleaned up
      const result = await prisma.$transaction(async tx => {
        // Delete related email file links
        await tx.emailFileLink.deleteMany({
          where: {
            file_id: existingFile.id
          }
        });

        // Delete related trello card file links
        await tx.trelloCardFileLink.deleteMany({
          where: {
            file_id: existingFile.id
          }
        });

        // Delete the file itself
        const deletedFile = await tx.file.delete({
          where: {
            id: existingFile.id
          }
        });

        return deletedFile;
      });

      return res.json({
        success: true,
        data: {
          id: result.id,
          name: result.name,
          deletedAt: new Date().toISOString()
        },
        message: "File deleted successfully",
        meta: {
          relatedItemsDeleted: {
            emailFileLinks: existingFile.emails?.length || 0,
            trelloCardFileLinks: existingFile.card_links?.length || 0
          }
        }
      });
    } catch (error) {
      console.error("Error deleting file:", error);

      // Handle Prisma specific errors
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return res.status(404).json({
            success: false,
            error: "File not found or already deleted",
            code: "FILE_NOT_FOUND"
          });
        }

        if (error.code === "P2003") {
          return res.status(409).json({
            success: false,
            error: "Cannot delete file due to foreign key constraints",
            code: "DELETE_CONSTRAINT_ERROR"
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: "Internal server error while deleting file",
        code: "DELETE_FILE_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  };
};

export default deleteFileController;
