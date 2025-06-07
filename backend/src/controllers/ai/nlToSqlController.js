import { sendSuccess, sendError } from '../../utils/responses.js';
import { 
  AuthenticationError, 
  ExternalServiceError, 
  DatabaseError,
  ValidationError 
} from '../../utils/errors.js';
import SqlGenerationService from '../../services/SqlGenerationService.js';
import SqlSafetyService from '../../services/SqlSafetyService.js';
import SqlResponseService from '../../services/SqlResponseService.js';

/**
 * Process natural language queries by converting to SQL and executing
 * 
 * @param {object} openai - OpenAI client instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const nlToSqlController = (openai, prisma) => async (req, res) => {
  const { question } = req.body;
  const userId = req.user.userId;

  try {
    // Validate input
    if (!question || typeof question !== 'string') {
      throw new ValidationError('Question is required and must be a string');
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new AuthenticationError('OpenAI API key not configured', 'OPENAI_AUTH_REQUIRED');
    }

    // Initialize services
    const sqlGenerator = new SqlGenerationService(openai);
    const sqlSafety = new SqlSafetyService();
    const sqlResponse = new SqlResponseService(openai);

    let generatedSql, sqlExplanation, sqlResults, naturalResponse;

    try {
      // Step 1: Generate SQL from natural language
      const sqlGeneration = await sqlGenerator.generateSql(question, userId);
      generatedSql = sqlGeneration.sql;
      sqlExplanation = sqlGeneration.explanation;

      // Step 2: Validate and sanitize SQL
      const validation = sqlSafety.validateQuery(generatedSql, userId);
      if (!validation.isValid) {
        throw new ValidationError(`SQL validation failed: ${validation.errors.join(', ')}`);
      }

      const sanitizedSql = validation.sanitizedSql;

      // Step 3: Execute SQL query
      try {
        sqlResults = await prisma.$queryRawUnsafe(sanitizedSql);
      } catch (dbError) {
        throw new DatabaseError('Failed to execute generated SQL query', 'nlToSql', dbError);
      }

      // Step 4: Generate natural language response
      try {
        naturalResponse = await sqlResponse.generateResponse(
          question, 
          sanitizedSql, 
          sqlResults, 
          sqlExplanation
        );
      } catch (responseError) {
        throw new ExternalServiceError('OpenAI', 'Failed to generate natural language response', responseError);
      }

      // Step 5: Log the query for analytics
      try {
        await logNlToSqlQuery(prisma, userId, question, sanitizedSql, sqlResults, naturalResponse);
      } catch (logError) {
        console.warn('Failed to log NL-to-SQL query:', logError.message);
        // Don't fail the request if logging fails
      }

      // Return successful response
      sendSuccess(res, {
        question,
        answer: naturalResponse,
        sql: {
          query: sanitizedSql,
          explanation: sqlExplanation,
          resultCount: Array.isArray(sqlResults) ? sqlResults.length : 1
        },
        warnings: validation.warnings || [],
        timestamp: new Date().toISOString()
      });

    } catch (stepError) {
      // Handle specific step errors
      if (stepError instanceof ValidationError || 
          stepError instanceof DatabaseError || 
          stepError instanceof ExternalServiceError) {
        throw stepError;
      }
      
      // Wrap unexpected errors
      throw new ExternalServiceError('NL-to-SQL', `Processing failed: ${stepError.message}`, stepError);
    }

  } catch (error) {
    // Handle different error types appropriately
    if (error instanceof ValidationError) {
      const err = new Error(error.message);
      err.code = 'VALIDATION_ERROR';
      err.details = { question };
      return sendError(res, err, 400);
    }

    if (error instanceof AuthenticationError) {
      const err = new Error(error.message);
      err.code = error.code || 'AUTH_ERROR';
      return sendError(res, err, 401);
    }

    if (error instanceof DatabaseError) {
      console.error('Database error in NL-to-SQL:', error);
      const err = new Error('Database query failed. Please try rephrasing your question.');
      err.code = 'DATABASE_ERROR';
      err.details = { question };
      return sendError(res, err, 500);
    }

    if (error instanceof ExternalServiceError) {
      console.error('External service error in NL-to-SQL:', error);
      const err = new Error('AI service temporarily unavailable. Please try again later.');
      err.code = 'SERVICE_ERROR';
      err.details = { question };
      return sendError(res, err, 503);
    }

    // Handle unexpected errors
    console.error('Unexpected error in NL-to-SQL controller:', error);
    const err = new Error('An unexpected error occurred while processing your question.');
    err.code = 'INTERNAL_ERROR';
    return sendError(res, err, 500);
  }
};

/**
 * Log NL-to-SQL queries for analytics and debugging
 * 
 * @param {object} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @param {string} question - Original user question
 * @param {string} sql - Generated SQL query
 * @param {Array} results - SQL execution results
 * @param {string} response - Natural language response
 */
async function logNlToSqlQuery(prisma, userId, question, sql, results, response) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      question: question.substring(0, 1000), // Truncate long questions
      sql: sql.substring(0, 2000), // Truncate long SQL
      resultCount: Array.isArray(results) ? results.length : 1,
      responseLength: response.length,
      success: true
    };

    console.log('NL-to-SQL Query Log:', JSON.stringify(logEntry, null, 2));

    // TODO: Implement proper logging to database when AI query log table is added
    // await prisma.aiQueryLog.create({
    //   data: {
    //     userId,
    //     type: 'NL_TO_SQL',
    //     query: question.substring(0, 1000),
    //     sql: sql.substring(0, 2000),
    //     response: response.substring(0, 3000),
    //     resultCount: Array.isArray(results) ? results.length : 1,
    //     success: true,
    //     createdAt: new Date()
    //   }
    // });

  } catch (error) {
    console.error('Failed to log NL-to-SQL query:', error);
    // Don't throw error - logging failure shouldn't break the main functionality
  }
}

/**
 * Health check endpoint for NL-to-SQL functionality
 * 
 * @param {object} openai - OpenAI client instance
 * @param {object} prisma - Prisma client instance
 * @returns {function} Express route handler
 */
export const nlToSqlHealthController = (openai, prisma) => async (req, res) => {
  try {
    const checks = {
      openai: !!process.env.OPENAI_API_KEY,
      database: false,
      services: false
    };

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Test service initialization
    try {
      const sqlGenerator = new SqlGenerationService(openai);
      const sqlSafety = new SqlSafetyService();
      const sqlResponse = new SqlResponseService(openai);
      checks.services = !!(sqlGenerator && sqlSafety && sqlResponse);
    } catch (error) {
      console.error('Service initialization failed:', error);
    }

    const allHealthy = Object.values(checks).every(check => check === true);

    sendSuccess(res, {
      healthy: allHealthy,
      checks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);
    sendError(res, {
      message: 'Health check failed',
      code: 'HEALTH_CHECK_ERROR'
    }, 500);
  }
};

export default nlToSqlController;