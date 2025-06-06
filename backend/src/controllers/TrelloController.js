import { PrismaClient } from '@prisma/client';
import trelloService from '../services/TrelloService.js';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError,
  NotFoundError 
} from '../utils/errors.js';

const prisma = new PrismaClient();

class TrelloController {
  // Get Trello boards with pagination and filtering
  async getBoards(req, res) {
    const { page, limit, filter } = req.query;
    const userId = req.user.userId;

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
              where: { trelloId: board.id },
              update: {
                name: board.name,
                url: board.url,
              },
              create: {
                trelloId: board.id,
                name: board.name,
                url: board.url,
                userId: userId,
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
      const whereClause = { userId };
      // Note: Trello doesn't have a direct "closed" status in our schema
      // You might want to add this field to the schema if needed

      // Get paginated results from database
      const skip = (page - 1) * limit;
      const [boards, total] = await Promise.all([
        prisma.trelloBoard.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { cards: true }
            }
          }
        }),
        prisma.trelloBoard.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(total / limit);

      // Transform response to match frontend expectations
      const transformedBoards = boards.map(board => ({
        ...board,
        id: board.trelloId, // Frontend expects 'id' field
        cardCount: board._count.cards
      }));

      res.json({
        success: true,
        data: { boards: transformedBoards },
        meta: {
          page,
          limit,
          total,
          totalPages,
          synced: savedBoards.length
        }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to access boards', 'getBoards', error);
      }
      throw error;
    }
  }

  // Get cards for a specific board
  async getBoardCards(req, res) {
    const { boardId } = req.params;
    const { page, limit, filter } = req.query;
    const userId = req.user.userId;

    try {
      // Check if board exists in database and belongs to user
      const board = await prisma.trelloBoard.findFirst({
        where: { 
          trelloId: boardId,
          userId 
        }
      });

      if (!board) {
        throw new NotFoundError('Trello board not found in database');
      }

      // Get Trello credentials
      const trelloApiKey = process.env.TRELLO_API_KEY;
      const trelloToken = process.env.TRELLO_TOKEN;

      if (!trelloApiKey || !trelloToken) {
        throw new AuthenticationError('Trello API credentials not configured', 'TRELLO_AUTH_REQUIRED');
      }

      // Fetch cards from Trello
      let trelloCards;
      try {
        trelloCards = await trelloService.getCardsForBoard(trelloApiKey, trelloToken, boardId);
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
              },
              create: {
                trelloId: card.id,
                name: card.name,
                description: card.desc,
                url: card.url,
                dueDate: card.due ? new Date(card.due) : null,
                boardId: board.id,
                userId: userId,
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

      // Get paginated results from database
      const skip = (page - 1) * limit;
      const [cards, total] = await Promise.all([
        prisma.trelloCard.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.trelloCard.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: { cards },
        meta: {
          page,
          limit,
          total,
          totalPages,
          synced: savedCards.length
        }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to access cards', 'getBoardCards', error);
      }
      throw error;
    }
  }

  // Get a specific board by ID
  async getBoardById(req, res) {
    const { boardId } = req.params;
    const userId = req.user.userId;

    try {
      const board = await prisma.trelloBoard.findFirst({
        where: { 
          trelloId: boardId,
          userId 
        },
        include: {
          _count: {
            select: { cards: true }
          }
        }
      });

      if (!board) {
        throw new NotFoundError('Board not found');
      }

      const transformedBoard = {
        ...board,
        id: board.trelloId,
        cardCount: board._count.cards
      };

      res.json({
        success: true,
        data: { board: transformedBoard }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to retrieve board', 'getBoardById', error);
      }
      throw error;
    }
  }

  // Sync all boards and their cards
  async syncBoards(req, res) {
    const userId = req.user.userId;

    try {
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

      // Sync boards and cards
      const syncResults = await prisma.$transaction(async (tx) => {
        let boardsCreated = 0;
        let boardsUpdated = 0;
        let cardsCreated = 0;
        let cardsUpdated = 0;
        let errors = 0;

        for (const board of trelloBoards) {
          try {
            // Upsert board
            const savedBoard = await tx.trelloBoard.upsert({
              where: { trelloId: board.id },
              update: {
                name: board.name,
                url: board.url,
              },
              create: {
                trelloId: board.id,
                name: board.name,
                url: board.url,
                userId: userId,
              },
            });

            // Check if board was created or updated
            const existingBoard = await tx.trelloBoard.findUnique({
              where: { trelloId: board.id },
              select: { createdAt: true }
            });
            
            if (existingBoard && new Date(existingBoard.createdAt) < new Date(Date.now() - 1000)) {
              boardsUpdated++;
            } else {
              boardsCreated++;
            }

            // Fetch and sync cards for this board
            try {
              const cards = await trelloService.getCardsForBoard(trelloApiKey, trelloToken, board.id);
              
              for (const card of cards) {
                try {
                  await tx.trelloCard.upsert({
                    where: { trelloId: card.id },
                    update: {
                      name: card.name,
                      description: card.desc,
                      url: card.url,
                      dueDate: card.due ? new Date(card.due) : null,
                    },
                    create: {
                      trelloId: card.id,
                      name: card.name,
                      description: card.desc,
                      url: card.url,
                      dueDate: card.due ? new Date(card.due) : null,
                      boardId: savedBoard.id,
                      userId: userId,
                    },
                  });

                  // Check if card was created or updated
                  const existingCard = await tx.trelloCard.findUnique({
                    where: { trelloId: card.id },
                    select: { createdAt: true }
                  });
                  
                  if (existingCard && new Date(existingCard.createdAt) < new Date(Date.now() - 1000)) {
                    cardsUpdated++;
                  } else {
                    cardsCreated++;
                  }
                } catch (cardError) {
                  console.warn(`Failed to sync card ${card.id}:`, cardError.message);
                  errors++;
                }
              }
            } catch (cardsError) {
              console.warn(`Failed to fetch cards for board ${board.id}:`, cardsError.message);
              errors++;
            }
          } catch (boardError) {
            console.warn(`Failed to sync board ${board.id}:`, boardError.message);
            errors++;
          }
        }

        return { 
          boardsCreated, 
          boardsUpdated, 
          cardsCreated, 
          cardsUpdated, 
          errors, 
          totalBoards: trelloBoards.length 
        };
      });

      res.json({
        success: true,
        data: {
          message: 'Trello data synced successfully',
          results: syncResults
        }
      });

    } catch (error) {
      if (error.code && error.code.startsWith('P')) {
        throw new DatabaseError('Failed to sync Trello data', 'syncBoards', error);
      }
      throw error;
    }
  }
}

export default new TrelloController();
