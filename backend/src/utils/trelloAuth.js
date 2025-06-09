import { AuthenticationError } from './errors.js';

/**
 * Get Trello credentials for a user from the database
 * 
 * @param {object} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @returns {Promise<{trello_api_key: string, trello_token: string}>} User's Trello credentials
 * @throws {AuthenticationError} If user doesn't exist or credentials are not configured
 */
export const getTrelloCredentials = async (prisma, userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      trello_api_key: true,
      trello_token: true
    }
  });
  
  if (!user || !user.trello_api_key || !user.trello_token) {
    throw new AuthenticationError('Trello API credentials not configured for this user', 'TRELLO_AUTH_REQUIRED');
  }

  return {
    trello_api_key: user.trello_api_key,
    trello_token: user.trello_token
  };
}; 