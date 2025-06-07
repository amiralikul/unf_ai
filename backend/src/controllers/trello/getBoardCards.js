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
  const { page = 1, limit = 10, filter, search } = req.query;
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

    // Fetch both cards and lists from Trello
    let trelloCards, trelloLists;
    try {
      [trelloCards, trelloLists] = await Promise.all([
        trelloService.getCardsForBoard(trelloApiKey, trelloToken, boardId),
        trelloService.getBoardLists(trelloApiKey, trelloToken, boardId)
      ]);
    } catch (error) {
      throw new ExternalServiceError('Trello', error.message, error);
    }

    // Create a map of list IDs to list info for status mapping
    const listMap = {};
    const sortedLists = trelloLists.sort((a, b) => a.pos - b.pos);
    
    sortedLists.forEach((list, index) => {
      listMap[list.id] = {
        name: list.name,
        position: index,
        status: trelloService.mapListNameToStatus(list.name)
      };
    });

    // Enhance status mapping with position-based fallback
    sortedLists.forEach((list, index) => {
      const listInfo = listMap[list.id];
      if (listInfo.status === 'To Do' && index > 0) {
        // Refine status based on position if name-based mapping was generic
        const totalLists = sortedLists.length;
        if (index === 0) listInfo.status = 'To Do';
        else if (index === totalLists - 1) listInfo.status = 'Done';
        else if (index === totalLists - 2) listInfo.status = 'Review';
        else listInfo.status = 'In Progress';
      }
    });

    // Save/update cards in database with enhanced mapping
    const savedCards = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const card of trelloCards) {
        try {
          // Map card to enhanced data
          const listInfo = listMap[card.idList] || { status: 'To Do' };
          const priority = trelloService.extractPriorityFromLabels(card.labels);
          
          const savedCard = await tx.trelloCard.upsert({
            where: { trelloId: card.id },
            update: {
              name: card.name,
              description: card.desc,
              url: card.url,
              dueDate: card.due ? new Date(card.due) : null,
              status: listInfo.status,
              priority: priority,
              position: card.pos,
              listId: card.idList
            },
            create: {
              trelloId: card.id,
              name: card.name,
              description: card.desc,
              url: card.url,
              dueDate: card.due ? new Date(card.due) : null,
              status: listInfo.status,
              priority: priority,
              position: card.pos,
              listId: card.idList,
              board: {
                connect: {
                  id: board.id
                }
              },
              user: {
                connect: {
                  id: userId
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
    
    // Add filter logic (search is handled separately with raw SQL)
    if (filter === 'recent') {
      // Show cards created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereClause.createdAt = { gte: thirtyDaysAgo };
    } else if (filter === 'due-soon') {
      // Show cards with due dates in the next 7 days
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      whereClause.dueDate = {
        gte: new Date(),
        lte: nextWeek
      };
    } else if (filter === 'overdue') {
      // Show cards with past due dates
      whereClause.dueDate = {
        lt: new Date()
      };
    } else if (filter && filter !== 'all') {
      // Handle both legacy filter values and direct status filtering
      const statusMap = {
        'todo': 'To Do',
        'inprogress': 'In Progress', 
        'review': 'Review',
        'done': 'Done'
      };
      
      // Use mapped status if it's a legacy filter, otherwise treat as direct status value
      const targetStatus = statusMap[filter] || filter;
      whereClause.status = targetStatus;
    }

    // Get paginated results from database
    let cards, total;
    
    if (search) {
      // For search queries, use raw SQL to support case-insensitive search in SQLite
      const searchPattern = `%${search.toLowerCase()}%`;
      const baseWhereConditions = [];
      const baseParams = [];
      
      // Add base conditions
      baseWhereConditions.push('boardId = ?');
      baseParams.push(board.id);
      baseWhereConditions.push('userId = ?');
      baseParams.push(userId);
      
      // Add filter conditions if any
      if (filter && filter !== 'all') {
        if (filter === 'recent') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          baseWhereConditions.push('createdAt >= ?');
          baseParams.push(thirtyDaysAgo.toISOString());
        } else if (filter === 'due-soon') {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          baseWhereConditions.push('dueDate >= ? AND dueDate <= ?');
          baseParams.push(new Date().toISOString(), nextWeek.toISOString());
        } else if (filter === 'overdue') {
          baseWhereConditions.push('dueDate < ?');
          baseParams.push(new Date().toISOString());
        } else {
          // Handle both legacy filter values and direct status filtering
          const statusMap = {
            'todo': 'To Do',
            'inprogress': 'In Progress', 
            'review': 'Review',
            'done': 'Done'
          };
          
          // Use mapped status if it's a legacy filter, otherwise treat as direct status value
          const targetStatus = statusMap[filter] || filter;
          baseWhereConditions.push('status = ?');
          baseParams.push(targetStatus);
        }
      }
      
      const baseWhere = baseWhereConditions.join(' AND ');
      
      // Build search query with case-insensitive LIKE
      const searchQuery = `
        SELECT * FROM TrelloCard 
        WHERE ${baseWhere} AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)
        ORDER BY status ASC, position ASC, name ASC
        LIMIT ? OFFSET ?
      `;
      
      const countQuery = `
        SELECT COUNT(*) as count FROM TrelloCard 
        WHERE ${baseWhere} AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)
      `;
      
      const searchParams = [...baseParams, searchPattern, searchPattern];
      
      [cards, total] = await Promise.all([
        prisma.$queryRawUnsafe(searchQuery, ...searchParams, pagination.limit, pagination.skip),
        prisma.$queryRawUnsafe(countQuery, ...searchParams).then(result => Number(result[0].count))
      ]);
    } else {
      // For non-search queries, use regular Prisma queries
      [cards, total] = await Promise.all([
        prisma.trelloCard.findMany({
          where: whereClause,
          skip: pagination.skip,
          take: pagination.limit,
          orderBy: [
            { status: 'asc' },
            { position: 'asc' },
            { name: 'asc' }
          ]
        }),
        prisma.trelloCard.count({ where: whereClause })
      ]);
    }

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
        },
        lists: sortedLists.map(list => ({
          id: list.id,
          name: list.name,
          status: listMap[list.id].status
        }))
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
