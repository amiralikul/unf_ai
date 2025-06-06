import { sendSuccess } from '../../utils/responses.js';
import { DatabaseError } from '../../utils/errors.js';

/**
 * Get AI usage statistics
 * 
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const getUsageStatsController = (prisma) => async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get basic stats about user's data
    const [filesCount, emailsCount, cardsCount] = await Promise.all([
      prisma.file.count({ where: { userId } }),
      prisma.email.count({ where: { userId } }),
      prisma.trelloCard.count({ where: { userId } })
    ]);

    const stats = {
      dataAvailable: {
        files: filesCount,
        emails: emailsCount,
        cards: cardsCount,
        total: filesCount + emailsCount + cardsCount
      },
      aiFeatures: {
        queryProcessing: !!process.env.OPENAI_API_KEY,
        contextSearch: true,
        multiSourceAnalysis: true
      },
      lastUpdated: new Date().toISOString()
    };

    sendSuccess(res, stats);

  } catch (error) {
    if (error.code && error.code.startsWith('P')) {
      throw new DatabaseError('Failed to retrieve usage stats', 'getUsageStats', error);
    }
    throw error;
  }
};

export default getUsageStatsController;
