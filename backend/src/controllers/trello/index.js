import getBoardsController from './getBoards.js';
import getBoardCardsController from './getBoardCards.js';
import syncBoardsController from './syncBoards.js';
import updateCardController from './updateCard.js';
import deleteCardController from './deleteCard.js';

/**
 * Factory function to create Trello controllers with dependencies
 * 
 * @param {object} dependencies - Controller dependencies
 * @returns {object} Trello controllers
 */
export const createTrelloControllers = ({ trelloService, prisma }) => ({
  getBoards: getBoardsController(trelloService, prisma),
  getBoardCards: getBoardCardsController(trelloService, prisma),
  syncBoards: syncBoardsController(trelloService, prisma),
  updateCard: updateCardController(trelloService, prisma),
  deleteCard: deleteCardController(trelloService, prisma)
});

export {
  getBoardsController,
  getBoardCardsController,
  syncBoardsController,
  updateCardController,
  deleteCardController
};
