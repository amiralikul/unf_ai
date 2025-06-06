import { PrismaClient } from '@prisma/client';
import GoogleOAuthService from '../services/GoogleOAuthService.js';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError,
  NotFoundError 
} from '../utils/errors.js';

const prisma = new PrismaClient();
const googleOAuth = new GoogleOAuthService();

class DriveController {
  // Get Drive files with pagination and filtering
  async getFiles(req, res) {
    const { page, limit, mimeType, modifiedAfter, modifiedBefore } = req.query;
    const userId = req.user.userId;

    try {
      // Get user with tokens
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.googleAccessToken) {
        throw new AuthenticationError('Google authentication required', 'GOOGLE_AUTH_REQUIRED');
      }

      const tokens = {
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      };

      // Fetch files from Google Drive
      let driveFiles;
      try {
        driveFiles = await googleOAuth.getDriveFiles(tokens, limit);
      } catch (error) {
        throw new ExternalServiceError('Google Drive', error.message, error);
      }

      // Build database query filters
      const whereClause = { userId };
      if (mimeType) whereClause.mimeType = mimeType;
      if (modifiedAfter || modifiedBefore) {
        whereClause.modifiedAt = {};
        if (modifiedAfter) whereClause.modifiedAt.gte = new Date(modifiedAfter);
        if (modifiedBefore) whereClause.modifiedAt.lte = new Date(modifiedBefore);
      }

      // Save/update files in database with transaction
      const savedFiles = await prisma.$transaction(async (tx) => {
        const results = [];
        
        for (const file of driveFiles) {
          try {
            const savedFile = await tx.file.upsert({
              where: { googleId: file.id },
              update: {
                name: file.name,
                mimeType: file.mimeType,
                size: file.size ? parseInt(file.size) : null,
                webViewLink: file.webViewLink,
                owners: JSON.stringify(file.owners),
                modifiedAt: new Date(file.modifiedTime),
              },
              create: {
                googleId: file.id,
                name: file.name,
                mimeType: file.mimeType,
                size: file.size ? parseInt(file.size) : null,
                webViewLink: file.webViewLink,
                owners: JSON.stringify(file.owners),
                modifiedAt: new Date(file.modifiedTime),
                userId: userId,
              },
            });
            results.push(savedFile);
          } catch (dbError) {
            console.warn(`Failed to save file ${file.id}:`, dbError.message);
            // Continue with other files
          }
        }
        
        return results;
      });

      // Get paginated results from database
      const skip = (page - 1) * limit;
      const [files, total] = await Promise.all([
        prisma.file.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { modifiedAt: 'desc' }
        }),
        prisma.file.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: { files },
        meta: {
          page,
          limit,
          total,
          totalPages,
          synced: savedFiles.length
        }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to access files', 'getFiles', error);
      }
      throw error;
    }
  }

  // Get a specific file by ID
  async getFileById(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const file = await prisma.file.findFirst({
        where: { 
          id,
          userId 
        }
      });

      if (!file) {
        throw new NotFoundError('File not found');
      }

      res.json({
        success: true,
        data: { file }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to retrieve file', 'getFileById', error);
      }
      throw error;
    }
  }

  // Delete a file (from database only, not from Google Drive)
  async deleteFile(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const file = await prisma.file.findFirst({
        where: { 
          id,
          userId 
        }
      });

      if (!file) {
        throw new NotFoundError('File not found');
      }

      await prisma.file.delete({
        where: { id }
      });

      res.json({
        success: true,
        data: { message: 'File deleted from database' }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to delete file', 'deleteFile', error);
      }
      throw error;
    }
  }

  // Sync files from Google Drive
  async syncFiles(req, res) {
    const userId = req.user.userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.googleAccessToken) {
        throw new AuthenticationError('Google authentication required', 'GOOGLE_AUTH_REQUIRED');
      }

      const tokens = {
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      };

      // Fetch all files from Google Drive
      let driveFiles;
      try {
        driveFiles = await googleOAuth.getDriveFiles(tokens, 1000); // Get more files for sync
      } catch (error) {
        throw new ExternalServiceError('Google Drive', error.message, error);
      }

      // Batch update database
      const syncResults = await prisma.$transaction(async (tx) => {
        let created = 0;
        let updated = 0;
        let errors = 0;

        for (const file of driveFiles) {
          try {
            const result = await tx.file.upsert({
              where: { googleId: file.id },
              update: {
                name: file.name,
                mimeType: file.mimeType,
                size: file.size ? parseInt(file.size) : null,
                webViewLink: file.webViewLink,
                owners: JSON.stringify(file.owners),
                modifiedAt: new Date(file.modifiedTime),
              },
              create: {
                googleId: file.id,
                name: file.name,
                mimeType: file.mimeType,
                size: file.size ? parseInt(file.size) : null,
                webViewLink: file.webViewLink,
                owners: JSON.stringify(file.owners),
                modifiedAt: new Date(file.modifiedTime),
                userId: userId,
              },
            });

            // Check if it was created or updated (Prisma doesn't tell us directly)
            const existingFile = await tx.file.findUnique({
              where: { googleId: file.id },
              select: { createdAt: true }
            });
            
            if (existingFile && new Date(existingFile.createdAt) < new Date(Date.now() - 1000)) {
              updated++;
            } else {
              created++;
            }
          } catch (dbError) {
            console.warn(`Failed to sync file ${file.id}:`, dbError.message);
            errors++;
          }
        }

        return { created, updated, errors, total: driveFiles.length };
      });

      res.json({
        success: true,
        data: {
          message: 'Files synced successfully',
          results: syncResults
        }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to sync files', 'syncFiles', error);
      }
      throw error;
    }
  }
}

export default new DriveController();
