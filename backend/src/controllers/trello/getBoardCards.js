import { sendSuccess } from '../../utils/responses.js';
import { getPaginationParams, getPaginationMeta } from '../../utils/pagination.js';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError,
  NotFoundError
} from '../../utils/errors.js';

/**
 * Get cards for a specific Trello board with pagination and filtering
 * 
 * @param {object} trelloService - Trello service instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const getBoardCardsController = (trelloService, prisma) => async (req, res) => {
  const { boardId } = req.params;
  const { page = 1, limit = 10, filter } = req.query;
  const userId = req.user.userId;
  const pagination = getPaginationParams({ page, limit });

  try {
    // Verify board exists and belongs to user
    const board = await prisma.trelloBoard.findFirst({
      where: {
        trelloId: boardId,
        userId
      }
    });

    if (!board) {
      throw new NotFoundError('Board not found or access denied', 'BOARD_NOT_FOUND');
    }

    // Get Trello credentials from environment (for now)
    const trelloApiKey = process.env.TRELLO_API_KEY;
    const trelloToken = process.env.TRELLO_TOKEN;

    if (!trelloApiKey || !trelloToken) {
      throw new AuthenticationError('Trello API credentials not configured', 'TRELLO_AUTH_REQUIRED');
    }

    // Fetch cards from Trello
    let trelloCards;
    try {
      trelloCards = await trelloService.getBoardCards(boardId, trelloApiKey, trelloToken);
    } catch (error) {
      throw new ExternalServiceError('Trello', error.message, error);
    }

    // Save/update cards in database with transaction
    const savedCards = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const card of trelloCards) {
        try {
          const savedCard = await tx.trelloCard.upsert({
            where: { trelloId: card.id },
            update: {
              name: card.name,
              description: card.desc,
              url: card.url,
              dueDate: card.due ? new Date(card.due) : null,
              closed: card.closed
            },
            create: {
              trelloId: card.id,
              name: card.name,
              description: card.desc,
              url: card.url,
              dueDate: card.due ? new Date(card.due) : null,
              closed: card.closed,
              userId,
              board: {
                connect: {
                  id: board.id
                }
              }
            },
          });
          results.push(savedCard);
        } catch (dbError) {
          console.warn(`Failed to save card ${card.id}:`, dbError.message);
          // Continue with other cards
        }
      }
      
      return results;
    });

    // Build database query filters
    const whereClause = { 
      boardId: board.id,
      userId
    };
    
    // Add filter logic if needed
    if (filter === 'active') {
      whereClause.closed = false;
    } else if (filter === 'closed') {
      whereClause.closed = true;
    }

    // Get paginated results from database
    const [cards, total] = await Promise.all([
      prisma.trelloCard.findMany({
        where: whereClause,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' }
      }),
      prisma.trelloCard.count({ where: whereClause })
    ]);

    // Calculate pagination metadata
    const paginationMeta = getPaginationMeta(total, pagination.page, pagination.limit);

    // Transform response to match frontend expectations
    const transformedCards = cards.map(card => ({
      ...card,
      id: card.trelloId, // Frontend expects 'id' field
      boardId: boardId,
      boardName: board.name
    }));

    // Send response
    sendSuccess(res, 
      { 
        cards: transformedCards,
        board: {
          id: board.trelloId,
          name: board.name,
          url: board.url
        }
      }, 
      {
        ...paginationMeta,
        synced: savedCards.length
      }
    );

  } catch (error) {
    if (error.code && error.code.startsWith('P')) {
      throw new DatabaseError('Failed to access board cards', 'getBoardCards', error);
    }
    throw error;
  }
};

export default getBoardCardsController;
