import getBoardsController from './getBoards.js';
import getBoardCardsController from './getBoardCards.js';
import syncBoardsController from './syncBoards.js';

/**
 * Factory function to create Trello controllers with dependencies
 * 
 * @param {object} dependencies - Controller dependencies
 * @returns {object} Trello controllers
 */
export const createTrelloControllers = ({ trelloService, prisma }) => ({
  getBoards: getBoardsController(trelloService, prisma),
  getBoardCards: getBoardCardsController(trelloService, prisma),
  syncBoards: syncBoardsController(trelloService, prisma)
});

export {
  getBoardsController,
  getBoardCardsController,
  syncBoardsController
};
