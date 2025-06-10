/**
 * Update file metadata in database
 * Functional approach to updating Drive file metadata
 */

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library.js";

/**
 * Factory function that creates the updateFile controller
 *
 * @param {object} googleOAuth - Google OAuth service instance
 * @param {object} prisma - Prisma client instance
 * @returns {Function} updateFile controller function
 */
const updateFileController = (googleOAuth, prisma) => {
  /**
   * Update file metadata
   *
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  return async (req, res) => {
    try {
      const { fileId } = req.params;
      const { name } = req.body;
      const userId = req.user.userId;

      // Validate required fields
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "File name is required and must be a non-empty string",
          code: "INVALID_FILE_NAME"
        });
      }

      if (name.trim().length > 255) {
        return res.status(400).json({
          success: false,
          error: "File name must be less than 255 characters",
          code: "FILE_NAME_TOO_LONG"
        });
      }

      // Check if file exists and user owns it
      const existingFile = await prisma.file.findUnique({
        where: {
          google_id: fileId
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
          error: "You do not have permission to update this file",
          code: "INSUFFICIENT_PERMISSIONS"
        });
      }

      // Get user tokens to update Google Drive
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
          error: "Google Drive authentication required to update file",
          code: "GOOGLE_AUTH_REQUIRED"
        });
      }

      const tokens = {
        access_token: user.google_access_token,
        refresh_token: user.google_refresh_token
      };

      // Update Google Drive first
      try {
        await googleOAuth.updateDriveFile(tokens, existingFile.google_id, {
          name: name.trim()
        });
      } catch (driveError) {
        console.error("Error updating Google Drive file:", driveError);
        return res.status(500).json({
          success: false,
          error: "Failed to update file in Google Drive",
          code: "DRIVE_UPDATE_ERROR",
          details: process.env.NODE_ENV === "development" ? driveError.message : undefined
        });
      }

      // Prepare update data
      const updateData = {
        name: name.trim()
      };

      // Update file in database
      const updatedFile = await prisma.file.update({
        where: {
          id: existingFile.id
        },
        data: updateData
      });

      // Convert BigInt fields to strings for JSON serialization
      const serializedFile = {
        ...updatedFile,
        size: updatedFile.size ? updatedFile.size.toString() : updatedFile.size
      };

      return res.json({
        success: true,
        data: serializedFile,
        message: "File updated successfully"
      });
    } catch (error) {
      console.error("Error updating file:", error);

      // Handle Prisma specific errors
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res.status(409).json({
            success: false,
            error: "A file with this name already exists",
            code: "DUPLICATE_FILE_NAME"
          });
        }

        if (error.code === "P2025") {
          return res.status(404).json({
            success: false,
            error: "File not found",
            code: "FILE_NOT_FOUND"
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: "Internal server error while updating file",
        code: "UPDATE_FILE_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  };
};

export default updateFileController;
