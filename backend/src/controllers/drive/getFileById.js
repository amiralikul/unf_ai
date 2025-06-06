import { sendSuccess } from '../../utils/responses.js';
import { 
  NotFoundError, 
  DatabaseError
} from '../../utils/errors.js';

/**
 * Get a specific Google Drive file by ID
 * 
 * @param {object} googleOAuth - Google OAuth service instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const getFileByIdController = (googleOAuth, prisma) => async (req, res) => {
  const { fileId } = req.params;
  const userId = req.user.userId;

  try {
    // Get file from database
    const file = await prisma.file.findFirst({
      where: {
        googleId: fileId,
        userId
      }
    });

    // Check if file exists
    if (!file) {
      throw new NotFoundError('File not found or access denied', 'FILE_NOT_FOUND');
    }

    // Transform response to match frontend expectations
    const transformedFile = {
      ...file,
      id: file.googleId, // Frontend expects 'id' field
      lastModified: file.modifiedAt
    };

    // Send response
    sendSuccess(res, { file: transformedFile });

  } catch (error) {
    if (error.code && error.code.startsWith('P')) {
      throw new DatabaseError('Failed to access file', 'getFileById', error);
    }
    throw error;
  }
};

export default getFileByIdController;
