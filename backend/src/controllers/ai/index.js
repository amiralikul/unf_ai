import processQueryController from './processQuery.js';
import getQueryHistoryController from './getQueryHistory.js';
import getUsageStatsController from './getUsageStats.js';
import { nlToSqlController, nlToSqlHealthController } from './nlToSqlController.js';

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
  nlToSql: nlToSqlController(openai, prisma),
  nlToSqlHealth: nlToSqlHealthController(openai, prisma)
});

export {
  processQueryController,
  getQueryHistoryController,
  getUsageStatsController,
  nlToSqlController,
  nlToSqlHealthController
};
