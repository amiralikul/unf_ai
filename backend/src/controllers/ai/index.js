import processQueryController from './processQuery.js';
import getQueryHistoryController from './getQueryHistory.js';
import getUsageStatsController from './getUsageStats.js';

/**
 * Factory function to create AI controllers with dependencies
 * 
 * @param {object} dependencies - Controller dependencies
 * @returns {object} AI controllers
 */
export const createAIControllers = ({ openai, prisma }) => ({
  processQuery: processQueryController(openai, prisma),
  getQueryHistory: getQueryHistoryController(prisma),
  getUsageStats: getUsageStatsController(prisma)
});

export {
  processQueryController,
  getQueryHistoryController,
  getUsageStatsController
};
