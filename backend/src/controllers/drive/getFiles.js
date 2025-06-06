import { sendSuccess } from '../../utils/responses.js';
import { getPaginationParams, getPaginationMeta } from '../../utils/pagination.js';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError
} from '../../utils/errors.js';

/**
 * Get Google Drive files with pagination and filtering
 * 
 * @param {object} googleOAuth - Google OAuth service instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const getFilesController = (googleOAuth, prisma) => async (req, res) => {
  const { page = 1, limit = 10, filter, search } = req.query;
  const userId = req.user.userId;
  const pagination = getPaginationParams({ page, limit });

  try {
    // Build database query filters
    const whereClause = { userId };
    
    // Add filter logic if needed
    if (filter === 'documents') {
      whereClause.mimeType = { contains: 'document' };
    } else if (filter === 'spreadsheets') {
      whereClause.mimeType = { contains: 'spreadsheet' };
    } else if (filter === 'presentations') {
      whereClause.mimeType = { contains: 'presentation' };
    } else if (filter === 'pdfs') {
      whereClause.mimeType = { contains: 'pdf' };
    }
    
    // Add search logic if provided
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    // Get paginated results from database
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: whereClause,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { modifiedAt: 'desc' }
      }),
      prisma.file.count({ where: whereClause })
    ]);

    // Calculate pagination metadata
    const paginationMeta = getPaginationMeta(total, pagination.page, pagination.limit);

    // Transform response to match frontend expectations
    const transformedFiles = files.map(file => ({
      ...file,
      id: file.googleId, // Frontend expects 'id' field
      lastModified: file.modifiedAt
    }));

    // Send response
    sendSuccess(res, 
      { files: transformedFiles }, 
      paginationMeta
    );

  } catch (error) {
    if (error.code && error.code.startsWith('P')) {
      throw new DatabaseError('Failed to access files', 'getFiles', error);
    }
    throw error;
  }
};

export default getFilesController;
