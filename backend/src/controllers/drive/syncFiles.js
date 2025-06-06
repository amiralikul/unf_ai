import { sendSuccess } from '../../utils/responses.js';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError
} from '../../utils/errors.js';

/**
 * Sync Google Drive files from the API
 * 
 * @param {object} googleOAuth - Google OAuth service instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const syncFilesController = (googleOAuth, prisma) => async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get Google Drive client
    const driveClient = await googleOAuth.getDriveClient(userId);
    
    if (!driveClient) {
      throw new AuthenticationError('Google Drive authentication required', 'GOOGLE_AUTH_REQUIRED');
    }

    // Fetch files from Google Drive
    let driveFiles;
    try {
      const response = await driveClient.files.list({
        pageSize: 100,
        fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, thumbnailLink)',
        orderBy: 'modifiedTime desc'
      });
      
      driveFiles = response.data.files || [];
    } catch (error) {
      throw new ExternalServiceError('Google Drive', error.message, error);
    }

    // Save/update files in database with transaction
    const syncResults = await prisma.$transaction(async (tx) => {
      const results = {
        total: driveFiles.length,
        created: 0,
        updated: 0,
        failed: 0
      };
      
      // Process each file
      for (const file of driveFiles) {
        try {
          // Check if file exists
          const existingFile = await tx.file.findUnique({
            where: { googleId: file.id }
          });
          
          // Save or update file
          await tx.file.upsert({
            where: { googleId: file.id },
            update: {
              name: file.name,
              mimeType: file.mimeType,
              size: parseInt(file.size) || 0,
              modifiedAt: new Date(file.modifiedTime),
              webViewLink: file.webViewLink,
              iconLink: file.iconLink,
              thumbnailLink: file.thumbnailLink
            },
            create: {
              googleId: file.id,
              name: file.name,
              mimeType: file.mimeType,
              size: parseInt(file.size) || 0,
              modifiedAt: new Date(file.modifiedTime),
              webViewLink: file.webViewLink,
              iconLink: file.iconLink,
              thumbnailLink: file.thumbnailLink,
              userId
            },
          });
          
          if (existingFile) {
            results.updated++;
          } else {
            results.created++;
          }
        } catch (fileError) {
          console.warn(`Failed to save file ${file.id}:`, fileError.message);
          results.failed++;
        }
      }
      
      return results;
    });

    // Send response
    sendSuccess(res, {
      message: 'Google Drive files synchronized successfully',
      stats: syncResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error.code && error.code.startsWith('P')) {
      throw new DatabaseError('Failed to sync Google Drive files', 'syncFiles', error);
    }
    throw error;
  }
};

export default syncFilesController;
