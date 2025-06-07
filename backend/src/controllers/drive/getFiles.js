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
    
    // Get paginated results from database (handle search with raw SQL for SQLite compatibility)
    let files, total;
    
    if (search) {
      // For search queries, use raw SQL to support case-insensitive search in SQLite
      const searchPattern = `%${search.toLowerCase()}%`;
      const baseWhereConditions = [];
      const baseParams = [];
      
      // Add base conditions
      baseWhereConditions.push('userId = ?');
      baseParams.push(userId);
      
      // Add filter conditions if any
      if (filter === 'documents') {
        baseWhereConditions.push('mimeType LIKE ?');
        baseParams.push('%document%');
      } else if (filter === 'spreadsheets') {
        baseWhereConditions.push('mimeType LIKE ?');
        baseParams.push('%spreadsheet%');
      } else if (filter === 'presentations') {
        baseWhereConditions.push('mimeType LIKE ?');
        baseParams.push('%presentation%');
      } else if (filter === 'pdfs') {
        baseWhereConditions.push('mimeType LIKE ?');
        baseParams.push('%pdf%');
      }
      
      const baseWhere = baseWhereConditions.join(' AND ');
      
      // Build search query with case-insensitive LIKE
      const searchQuery = `
        SELECT * FROM "File" 
        WHERE ${baseWhere} AND LOWER(name) LIKE ?
        ORDER BY modifiedAt DESC
        LIMIT ? OFFSET ?
      `;
      
      const countQuery = `
        SELECT COUNT(*) as count FROM "File" 
        WHERE ${baseWhere} AND LOWER(name) LIKE ?
      `;
      
      const searchParams = [...baseParams, searchPattern];
      
      [files, total] = await Promise.all([
        prisma.$queryRawUnsafe(searchQuery, ...searchParams, pagination.limit, pagination.skip),
        prisma.$queryRawUnsafe(countQuery, ...searchParams).then(result => Number(result[0].count))
      ]);
    } else {
      // For non-search queries, use regular Prisma queries
      [files, total] = await Promise.all([
        prisma.file.findMany({
          where: whereClause,
          skip: pagination.skip,
          take: pagination.limit,
          orderBy: { modifiedAt: 'desc' }
        }),
        prisma.file.count({ where: whereClause })
      ]);
    }

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
