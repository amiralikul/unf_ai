import processQueryController from './processQuery.js';
import getQueryHistoryController from './getQueryHistory.js';
import getUsageStatsController from './getUsageStats.js';
import langchainControllers from './langchainNlToSqlController.js';

/**
 * Factory function to create AI controllers with dependencies
 * 
 * @param {object} dependencies - Controller dependencies
 * @returns {object} AI controllers
 */
export const createAIControllers = ({ openai, prisma }) => ({
  processQuery: processQueryController(openai, prisma),
  getQueryHistory: getQueryHistoryController(prisma),
  getUsageStats: getUsageStatsController(prisma),
  // LangChain-based NL-to-SQL controllers
  nlToSql: langchainControllers.langchainNlToSql(openai, prisma),
  nlToSqlHealth: langchainControllers.langchainNlToSqlHealth(openai, prisma)
});

export {
  processQueryController,
  getQueryHistoryController,
  getUsageStatsController,
  langchainControllers
};
