import { sendSuccess, sendError } from "../../utils/responses.js";
import {
  AuthenticationError,
  ExternalServiceError,
  DatabaseError,
  ValidationError
} from "../../utils/errors.js";

/**
 * LangChain-based natural language to SQL controller
 * Provides an alternative implementation using LangChain's advanced SQL capabilities
 *
 * @param {object} openai - OpenAI client instance (for compatibility)
 * @param {object} prisma - Prisma client instance
 * @param {object} langchainService - LangChain SQL service instance
 * @returns {function} Express route handler
 */
export const langchainNlToSqlController =
  (openai, prisma, langchainService) => async (req, res) => {
    const { question } = req.body;
    const userId = req.user.userId;

    try {
      // Validate input
      if (!question || typeof question !== "string") {
        throw new ValidationError("Question is required and must be a string");
      }

      if (!process.env.OPENAI_API_KEY) {
        throw new AuthenticationError("OpenAI API key not configured", "OPENAI_AUTH_REQUIRED");
      }

      if (!process.env.DATABASE_URL) {
        throw new ValidationError("Database URL not configured");
      }

      let sqlResult;

      try {
        // Process the complete NL-to-SQL pipeline
        sqlResult = await langchainService.processQuery(question, userId);

        // Log the query for analytics (using existing logging function)
        try {
          await logNlToSqlQuery(
            prisma,
            userId,
            question,
            sqlResult.sql,
            sqlResult.results,
            sqlResult.response,
            "langchain" // Add source identifier
          );
        } catch (logError) {
          console.warn("Failed to log LangChain NL-to-SQL query:", logError.message);
          // Don't fail the request if logging fails
        }

        // Convert BigInts in results to strings for JSON serialization
        const processedResults = (sqlResult.results || []).map(row =>
          Object.fromEntries(
            Object.entries(row).map(([key, value]) => [
              key,
              typeof value === "bigint" ? value.toString() : value
            ])
          )
        );

        // Return successful response
        sendSuccess(res, {
          question,
          answer: sqlResult.response,
          sql: {
            query: sqlResult.sql,
            explanation: sqlResult.explanation,
            resultCount: sqlResult.resultCount,
            results: processedResults
          },
          method: "langchain",
          timestamp: new Date().toISOString()
        });
      } catch (serviceError) {
        // Handle LangChain service errors
        console.error("LangChain SQL service error:", serviceError);

        if (serviceError.message.includes("Forbidden SQL operation")) {
          throw new ValidationError(`SQL validation failed: ${serviceError.message}`);
        }

        if (serviceError.message.includes("user ID filter")) {
          throw new ValidationError("Query must include proper user data isolation");
        }

        if (serviceError.message.includes("Failed to execute query")) {
          throw new DatabaseError(
            "Failed to execute generated SQL query",
            "langchainNlToSql",
            serviceError
          );
        }

        // Wrap other service errors
        throw new ExternalServiceError(
          "LangChain",
          `Processing failed: ${serviceError.message}`,
          serviceError
        );
      }
    } catch (error) {
      // Handle different error types appropriately
      if (error instanceof ValidationError) {
        const err = new Error(error.message);
        err.code = "VALIDATION_ERROR";
        err.details = { question, method: "langchain" };
        return sendError(res, err, 400);
      }

      if (error instanceof AuthenticationError) {
        const err = new Error(error.message);
        err.code = error.code || "AUTH_ERROR";
        return sendError(res, err, 401);
      }

      if (error instanceof DatabaseError) {
        console.error("Database error in LangChain NL-to-SQL:", error);
        const err = new Error("Database query failed. Please try rephrasing your question.");
        err.code = "DATABASE_ERROR";
        err.details = { question, method: "langchain" };
        return sendError(res, err, 500);
      }

      if (error instanceof ExternalServiceError) {
        console.error("External service error in LangChain NL-to-SQL:", error);
        const err = new Error("AI service temporarily unavailable. Please try again.");
        err.code = "EXTERNAL_SERVICE_ERROR";
        err.details = { question, service: error.service, method: "langchain" };
        return sendError(res, err, 503);
      }

      // Handle unexpected errors
      console.error("Unexpected error in LangChain NL-to-SQL:", error);
      const err = new Error("An unexpected error occurred while processing your query.");
      err.code = "INTERNAL_ERROR";
      err.details = { question, method: "langchain" };
      return sendError(res, err, 500);
    }
  };

/**
 * Health check controller for LangChain NL-to-SQL functionality
 *
 * @param {object} openai - OpenAI client instance (for compatibility)
 * @param {object} prisma - Prisma client instance
 * @param {object} langchainService - LangChain SQL service instance
 * @returns {function} Express route handler
 */
export const langchainNlToSqlHealthController =
  (openai, prisma, langchainService) => async (req, res) => {
    try {
      const checks = {
        openaiKey: !!process.env.OPENAI_API_KEY,
        databaseUrl: !!process.env.DATABASE_URL,
        prisma: false,
        langchainService: false
      };

      // Test Prisma connection
      try {
        await prisma.$queryRaw`SELECT 1`;
        checks.prisma = true;
      } catch (error) {
        console.error("Prisma connection failed:", error);
      }

      // Test LangChain service initialization
      try {
        const healthResult = await langchainService.healthCheck();
        checks.langchainService = healthResult.status === "healthy";
        checks.langchainDetails = healthResult;
      } catch (error) {
        console.error("LangChain service health check failed:", error);
        checks.langchainError = error.message;
      }

      const allHealthy = Object.values(checks).every(check =>
        typeof check === "boolean" ? check === true : true
      );

      sendSuccess(res, {
        healthy: allHealthy,
        checks,
        method: "langchain",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("LangChain health check error:", error);
      sendError(
        res,
        {
          message: "LangChain health check failed",
          code: "HEALTH_CHECK_ERROR",
          method: "langchain"
        },
        500
      );
    }
  };

/**
 * Enhanced logging function for LangChain queries
 * Extends the existing logging with method identification
 */
async function logNlToSqlQuery(
  prisma,
  userId,
  question,
  sql,
  results,
  response,
  method = "langchain"
) {
  try {
    // This would typically log to a dedicated table or extend existing logging
    // For now, we'll use console logging with structured data
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      question,
      sql,
      resultCount: Array.isArray(results) ? results.length : 1,
      method,
      success: true
    };

    console.log("NL-to-SQL Query Log:", JSON.stringify(logEntry, null, 2));

    // If you have a dedicated logging table, you could insert here:
    // await prisma.nlToSqlLog.create({ data: logEntry });
  } catch (error) {
    console.error("Failed to log NL-to-SQL query:", error);
    throw error;
  }
}

export default {
  langchainNlToSql: langchainNlToSqlController,
  langchainNlToSqlHealth: langchainNlToSqlHealthController
};
