import { sendSuccess } from '../../utils/responses.js';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError
} from '../../utils/errors.js';
import { LinkDetectionService } from '../../services/LinkDetectionService.js';

/**
 * Sync Google Drive files from the API
 * 
 * @param {object} googleOAuth - Google OAuth service instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const syncFilesController = (googleOAuth, prisma) => async (req, res) => {
  const userId = req.user.userId;
  const linkDetectionService = new LinkDetectionService(prisma);

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
      throw new AuthenticationError('Google Drive authentication required', 'GOOGLE_AUTH_REQUIRED');
    }
    
    // Create tokens object
    const tokens = {
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token
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
          stats: { total: 0, created: 0, updated: 0, failed: 0, linksCreated: 0 },
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
        failed: 0,
        linksCreated: 0
      };
      
      // Process each file
      for (const file of driveFiles) {
        try {
          // Check if file exists
          const existingFile = await tx.file.findUnique({
            where: { google_id: file.id }
          });
          
          // Save or update file with enhanced metadata
          const savedFile = await tx.file.upsert({
            where: { google_id: file.id },
            update: {
              name: file.name,
              mime_type: file.mimeType,
              size: file.size ? BigInt(file.size) : null,
              modified_at: new Date(file.modifiedTime),
              web_view_link: file.webViewLink,
              owners: file.owners || [],
              file_type: file.fileType || 'drive',
              docs_url: file.docsUrl,
              is_shared: file.isShared || false
            },
            create: {
              google_id: file.id,
              name: file.name,
              mime_type: file.mimeType,
              size: file.size ? BigInt(file.size) : null,
              modified_at: new Date(file.modifiedTime),
              web_view_link: file.webViewLink,
              owners: file.owners || [],
              file_type: file.fileType || 'drive',
              docs_url: file.docsUrl,
              is_shared: file.isShared || false,
              user_id: userId
            },
          });

          // Check if file is referenced in any Trello card descriptions
          try {
            const cards = await tx.trelloCard.findMany({
              where: { user_id: userId },
              select: { id: true, description: true, name: true }
            });

            for (const card of cards) {
              const cardText = `${card.name} ${card.description || ''}`;
              const fileRefs = linkDetectionService.extractDriveFileReferences(cardText);
              
              if (fileRefs.includes(file.id)) {
                try {
                  await linkDetectionService.linkCardToFile(card.id, savedFile.id, 'reference');
                  results.linksCreated++;
                } catch (linkError) {
                  console.warn(`Failed to link card ${card.id} to file ${savedFile.id}:`, linkError.message);
                }
              }
            }
          } catch (linkError) {
            console.warn(`Failed to detect links for file ${savedFile.id}:`, linkError.message);
          }
          
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
