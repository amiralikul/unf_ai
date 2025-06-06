import getMessagesController from './getMessages.js';
import getMessageByIdController from './getMessageById.js';
import syncMessagesController from './syncMessages.js';

/**
 * Factory function to create Gmail controllers with dependencies
 * 
 * @param {object} dependencies - Controller dependencies
 * @returns {object} Gmail controllers
 */
export const createGmailControllers = ({ googleOAuth, prisma }) => ({
  getMessages: getMessagesController(googleOAuth, prisma),
  getMessageById: getMessageByIdController(googleOAuth, prisma),
  syncMessages: syncMessagesController(googleOAuth, prisma)
});

export {
  getMessagesController,
  getMessageByIdController,
  syncMessagesController
};
