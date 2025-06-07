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
    // Get user tokens from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        googleAccessToken: true,
        googleRefreshToken: true
      }
    });
    
    if (!user || !user.googleAccessToken) {
      throw new AuthenticationError('Google Drive authentication required', 'GOOGLE_AUTH_REQUIRED');
    }
    
    // Create tokens object
    const tokens = {
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    };

    // Fetch files from Google Drive using the service
    let driveFiles;
    try {
      // Use the existing getDriveFiles method with a higher limit
      driveFiles = await googleOAuth.getDriveFiles(tokens, 100);
      
      if (!driveFiles || driveFiles.length === 0) {
        // Return early if no files found
        return sendSuccess(res, {
          message: 'No Google Drive files found to synchronize',
          stats: { total: 0, created: 0, updated: 0, failed: 0 },
          timestamp: new Date().toISOString()
        });
      }
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
              owners: JSON.stringify(file.owners || [])
            },
            create: {
              googleId: file.id,
              name: file.name,
              mimeType: file.mimeType,
              size: parseInt(file.size) || 0,
              modifiedAt: new Date(file.modifiedTime),
              webViewLink: file.webViewLink,
              owners: JSON.stringify(file.owners || []),
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
