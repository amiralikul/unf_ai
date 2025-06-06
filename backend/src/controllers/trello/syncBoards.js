import { sendSuccess } from '../../utils/responses.js';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError
} from '../../utils/errors.js';

/**
 * Sync Trello boards and cards from the API
 * 
 * @param {object} trelloService - Trello service instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const syncBoardsController = (trelloService, prisma) => async (req, res) => {
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

    // Save/update boards and cards in database with transaction
    const syncResults = await prisma.$transaction(async (tx) => {
      const results = {
        boards: {
          total: trelloBoards.length,
          created: 0,
          updated: 0,
          failed: 0
        },
        cards: {
          total: 0,
          created: 0,
          updated: 0,
          failed: 0
        }
      };
      
      // Process each board
      for (const board of trelloBoards) {
        try {
          // Check if board exists
          const existingBoard = await tx.trelloBoard.findUnique({
            where: { trelloId: board.id }
          });
          
          // Save or update board
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
          
          if (existingBoard) {
            results.boards.updated++;
          } else {
            results.boards.created++;
          }
          
          // Fetch cards for this board
          let boardCards;
          try {
            boardCards = await trelloService.getBoardCards(board.id, trelloApiKey, trelloToken);
            results.cards.total += boardCards.length;
          } catch (cardError) {
            console.warn(`Failed to fetch cards for board ${board.id}:`, cardError.message);
            continue; // Skip to next board
          }
          
          // Process each card
          for (const card of boardCards) {
            try {
              const existingCard = await tx.trelloCard.findUnique({
                where: { trelloId: card.id }
              });
              
              await tx.trelloCard.upsert({
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
                      id: savedBoard.id
                    }
                  }
                },
              });
              
              if (existingCard) {
                results.cards.updated++;
              } else {
                results.cards.created++;
              }
            } catch (cardDbError) {
              console.warn(`Failed to save card ${card.id}:`, cardDbError.message);
              results.cards.failed++;
            }
          }
        } catch (boardDbError) {
          console.warn(`Failed to save board ${board.id}:`, boardDbError.message);
          results.boards.failed++;
        }
      }
      
      return results;
    });

    // Send response
    sendSuccess(res, {
      message: 'Trello data synchronized successfully',
      stats: syncResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error.code && error.code.startsWith('P')) {
      throw new DatabaseError('Failed to sync Trello data', 'syncBoards', error);
    }
    throw error;
  }
};

export default syncBoardsController;
