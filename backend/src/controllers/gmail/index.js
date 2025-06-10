import getMessagesController from "./getMessages.js";
import getMessageByIdController from "./getMessageById.js";
import syncMessagesController from "./syncMessages.js";
import updateMessageController from "./updateMessage.js";
import deleteMessageController from "./deleteMessage.js";

/**
 * Factory function to create Gmail controllers with dependencies
 *
 * @param {object} dependencies - Controller dependencies
 * @returns {object} Gmail controllers
 */
export const createGmailControllers = ({ googleOAuth, prisma, linkDetectionService }) => ({
  getMessages: getMessagesController(googleOAuth, prisma),
  getMessageById: getMessageByIdController(googleOAuth, prisma),
  syncMessages: syncMessagesController(googleOAuth, prisma, linkDetectionService),
  updateMessage: updateMessageController(googleOAuth, prisma),
  deleteMessage: deleteMessageController(googleOAuth, prisma)
});

export {
  getMessagesController,
  getMessageByIdController,
  syncMessagesController,
  updateMessageController,
  deleteMessageController
};
