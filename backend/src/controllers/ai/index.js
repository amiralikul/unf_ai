import langchainControllers from './langchainNlToSqlController.js';

/**
 * Factory function to create AI controllers with dependencies
 * 
 * @param {object} dependencies - Controller dependencies
 * @returns {object} AI controllers
 */
export const createAIControllers = ({ openai, prisma }) => ({
  // LangChain-based NL-to-SQL controllers
  nlToSql: langchainControllers.langchainNlToSql(openai, prisma),
  nlToSqlHealth: langchainControllers.langchainNlToSqlHealth(openai, prisma)
});

export {
  langchainControllers
};
