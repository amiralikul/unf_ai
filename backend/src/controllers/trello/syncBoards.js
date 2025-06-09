import { sendSuccess } from '../../utils/responses.js';
import { 
  ExternalServiceError, 
  DatabaseError
} from '../../utils/errors.js';
import { LinkDetectionService } from '../../services/LinkDetectionService.js';
import { getTrelloCredentials } from '../../utils/trelloAuth.js';

/**
 * Sync Trello boards and cards from the API
 * 
 * @param {object} trelloService - Trello service instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const syncBoardsController = (trelloService, prisma) => async (req, res) => {
  const userId = req.user.userId;
  const linkDetectionService = new LinkDetectionService(prisma);

  try {
    // Get Trello credentials from user profile
    const { trello_api_key, trello_token } = await getTrelloCredentials(prisma, userId);

    // Fetch boards from Trello
    let trelloBoards, trelloLists;
    try {
      trelloBoards = await trelloService.getBoards(trello_api_key, trello_token);
      
      // Also fetch all lists for all boards to get status info
      trelloLists = await Promise.all(
        trelloBoards.map(board => 
          trelloService.getBoardLists(trello_api_key, trello_token, board.id)
        )
      );
      trelloLists = trelloLists.flat();

    } catch (error) {
      throw new ExternalServiceError('Trello', error.message, error);
    }

    // Create a map of list IDs to list names
    const listMap = trelloLists.reduce((acc, list) => {
      acc[list.id] = list.name;
      return acc;
    }, {});

    // Save/update boards and their cards in a single transaction
    const syncResults = await prisma.$transaction(async (tx) => {
      const results = {
        boards: { created: 0, updated: 0, failed: 0, total: trelloBoards.length },
        cards: { created: 0, updated: 0, failed: 0, total: 0 },
        linksCreated: 0
      };
      
      for (const board of trelloBoards) {
        try {
          // Upsert board
          const existingBoard = await tx.trelloBoard.findUnique({ where: { trello_id: board.id } });
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

          if (existingBoard) results.boards.updated++;
          else results.boards.created++;

          // Fetch and upsert cards for this board
          const cards = await trelloService.getCardsForBoard(trello_api_key, trello_token, board.id);
          results.cards.total += cards.length;

          for (const card of cards) {
            try {
              const existingCard = await tx.trelloCard.findUnique({ where: { trello_id: card.id } });
              
              const savedCard = await tx.trelloCard.upsert({
                where: { trello_id: card.id },
                update: {
                  name: card.name,
                  description: card.desc,
                  url: card.url,
                  list_name: listMap[card.idList] || 'Unknown',
                  list_id: card.idList,
                  status: trelloService.mapListNameToStatus(listMap[card.idList] || 'Unknown'),
                  priority: trelloService.extractPriorityFromLabels(card.labels),
                  position: card.pos,
                  due_date: card.due ? new Date(card.due) : null,
                },
                create: {
                  trello_id: card.id,
                  name: card.name,
                  description: card.desc,
                  url: card.url,
                  list_name: listMap[card.idList] || 'Unknown',
                  list_id: card.idList,
                  status: trelloService.mapListNameToStatus(listMap[card.idList] || 'Unknown'),
                  priority: trelloService.extractPriorityFromLabels(card.labels),
                  position: card.pos,
                  due_date: card.due ? new Date(card.due) : null,
                  board_id: savedBoard.id,
                  user_id: userId,
                },
              });

              // Detect file and email references in card content
              try {
                const cardText = `${card.name} ${card.desc || ''}`;
                const linkResults = await linkDetectionService.processCardText(savedCard.id, cardText, userId);
                results.linksCreated += linkResults.fileLinks.length;
                
                if (linkResults.errors.length > 0) {
                  console.warn(`Link detection errors for card ${savedCard.id}:`, linkResults.errors);
                }
              } catch (linkError) {
                console.warn(`Failed to detect links for card ${savedCard.id}:`, linkError.message);
              }

              if (existingCard) results.cards.updated++;
              else results.cards.created++;

            } catch (cardError) {
              console.warn(`Failed to sync card ${card.id}:`, cardError.message);
              results.cards.failed++;
            }
          }
        } catch (boardError) {
          console.warn(`Failed to sync board ${board.id}:`, boardError.message);
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
