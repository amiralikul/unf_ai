import { sendSuccess } from '../../utils/responses.js';
import { getPaginationParams, getPaginationMeta } from '../../utils/pagination.js';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError
} from '../../utils/errors.js';

/**
 * Get Trello boards with pagination and filtering
 * 
 * @param {object} trelloService - Trello service instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const getBoardsController = (trelloService, prisma) => async (req, res) => {
  const { page = 1, limit = 10, filter } = req.query;
  const userId = req.user.userId;
  const pagination = getPaginationParams({ page, limit });

  try {
    // Get Trello credentials from environment (for now)
    const trelloApiKey = process.env.TRELLO_API_KEY;
    const trelloToken = process.env.TRELLO_TOKEN;

    if (!trelloApiKey || !trelloToken) {
      throw new AuthenticationError('Trello API credentials not configured', 'TRELLO_AUTH_REQUIRED');
    }

    // Fetch boards from Trello
    let trelloBoards;
    try {
      trelloBoards = await trelloService.getBoards(trelloApiKey, trelloToken);
    } catch (error) {
      throw new ExternalServiceError('Trello', error.message, error);
    }

    // Save/update boards in database with transaction
    const savedBoards = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const board of trelloBoards) {
        try {
          const savedBoard = await tx.trelloBoard.upsert({
            where: { trello_id: board.id },
            update: {
              name: board.name,
              url: board.url,
            },
            create: {
              trello_id: board.id,
              name: board.name,
              url: board.url,
              user_id: userId,
            },
          });
          results.push(savedBoard);
        } catch (dbError) {
          console.warn(`Failed to save board ${board.id}:`, dbError.message);
          // Continue with other boards
        }
      }
      
      return results;
    });

    // Build database query filters
    const whereClause = { user_id: userId };
    // Add filter logic if needed

    // Get paginated results from database
    const [boards, total] = await Promise.all([
      prisma.trelloBoard.findMany({
        where: whereClause,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { cards: true }
          }
        }
      }),
      prisma.trelloBoard.count({ where: whereClause })
    ]);

    // Calculate pagination metadata
    const paginationMeta = getPaginationMeta(total, pagination.page, pagination.limit);

    // Transform response to match frontend expectations
    const transformedBoards = boards.map(board => ({
      ...board,
      id: board.trello_id, // Frontend expects 'id' field
      cardCount: board._count.cards
    }));

    // Send response
    sendSuccess(res, 
      { boards: transformedBoards }, 
      {
        ...paginationMeta,
        synced: savedBoards.length
      }
    );

  } catch (error) {
    if (error.code && error.code.startsWith('P')) {
      throw new DatabaseError('Failed to access boards', 'getBoards', error);
    }
    throw error;
  }
};

export default getBoardsController;
