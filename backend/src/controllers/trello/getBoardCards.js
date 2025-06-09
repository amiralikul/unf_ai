import { sendSuccess } from '../../utils/responses.js';
import { getPaginationParams, getPaginationMeta } from '../../utils/pagination.js';
import { 
  ExternalServiceError, 
  DatabaseError,
  NotFoundError
} from '../../utils/errors.js';
import { getTrelloCredentials } from '../../utils/trelloAuth.js';

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
        trello_id: boardId,
        user_id: userId
      }
    });

    if (!board) {
      throw new NotFoundError('Board not found or access denied', 'BOARD_NOT_FOUND');
    }

    // Get Trello credentials from user profile
    const { trello_api_key, trello_token } = await getTrelloCredentials(prisma, userId);

    // Fetch both cards and lists from Trello
    let trelloCards, trelloLists;
    try {
      [trelloCards, trelloLists] = await Promise.all([
        trelloService.getCardsForBoard(trello_api_key, trello_token, boardId),
        trelloService.getBoardLists(trello_api_key, trello_token, boardId)
      ]);
    } catch (error) {
      throw new ExternalServiceError('Trello', error.message, error);
    }

    // Create a map of list IDs to list info for status mapping
    const listMap = {};
    const sortedLists = trelloLists.sort((a, b) => a.pos - b.pos);
    
    sortedLists.forEach(list => {
      const status = trelloService.mapListNameToStatus(list.name);
      listMap[list.id] = {
        id: list.id,
        name: list.name,
        status: status,
        position: list.pos
      };
    });

    // Save/update cards in database with transaction
    const savedCards = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const card of trelloCards) {
        try {
          // Map card to enhanced data
          const listInfo = listMap[card.idList] || { status: 'To Do' };
          const priority = trelloService.extractPriorityFromLabels(card.labels);
          
          const savedCard = await tx.trelloCard.upsert({
            where: { trello_id: card.id },
            update: {
              name: card.name,
              description: card.desc,
              url: card.url,
              due_date: card.due ? new Date(card.due) : null,
              status: listInfo.status,
              priority: priority,
              position: card.pos,
              list_id: card.idList
            },
            create: {
              trello_id: card.id,
              name: card.name,
              description: card.desc,
              url: card.url,
              due_date: card.due ? new Date(card.due) : null,
              status: listInfo.status,
              priority: priority,
              position: card.pos,
              list_id: card.idList,
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
      board_id: board.id,
      user_id: userId
    };

    // Add search filter
    if (search && search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    // Add status filter
    if (filter && filter !== 'all') {
      whereClause.status = filter;
    }

    // Get paginated results from database
    const [cards, total] = await Promise.all([
      prisma.trelloCard.findMany({
        where: whereClause,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: [
          { status: 'asc' },
          { position: 'asc' },
          { name: 'asc' }
        ],
        include: {
          file_links: {
            include: {
              file: true
            }
          },
          email_links: {
            include: {
              email: true
            }
          }
        }
      }),
      prisma.trelloCard.count({ where: whereClause })
    ]);

    // Calculate pagination metadata
    const paginationMeta = getPaginationMeta(total, pagination.page, pagination.limit);

    // Transform response to match frontend expectations
    const transformedCards = cards.map(card => ({
      ...card,
      id: card.trello_id, // Frontend expects 'id' field
      boardId: boardId,
      boardName: board.name,
      linkedFiles: card.file_links.map(link => ({
        id: link.file.id,
        name: link.file.name,
        googleId: link.file.google_id,
        webViewLink: link.file.web_view_link,
        modifiedAt: link.file.modified_at,
        fileType: link.file.file_type,
        mimeType: link.file.mime_type,
        linkType: link.link_type,
        linkedAt: link.created_at
      })),
      linkedEmails: card.email_links.map(link => ({
        id: link.email.id,
        subject: link.email.subject,
        senderName: link.email.sender_name,
        senderEmail: link.email.sender_email,
        receivedAt: link.email.received_at,
        snippet: link.email.snippet,
        linkType: link.link_type,
        linkedAt: link.created_at
      })),
      // Remove the raw relationship data from the response
      file_links: undefined,
      email_links: undefined
    }));

    // Send response
    sendSuccess(res, 
      { 
        cards: transformedCards,
        board: {
          id: board.trello_id,
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
