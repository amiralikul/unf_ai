import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

/**
 * LangChain-based SQL service for natural language to SQL conversion
 * Uses LangChain's advanced prompt engineering with Prisma for database operations
 */
export class LangChainSqlService {
  constructor(openaiApiKey, prismaClient) {
    this.openaiApiKey = openaiApiKey;
    this.prisma = prismaClient;

    // Initialize OpenAI model
    this.llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: 'gpt-4',
      temperature: 0.1,
      maxTokens: 1000,
    });

    // Initialize lighter model for response generation
    this.responseLlm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 800,
    });

    this.sqlChain = null;
    this.responseChain = null;
    this.initialized = false;
  }

  /**
   * Initialize the chains
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create SQL query generation chain
      this.sqlChain = await this.createSqlChain();

      // Create response generation chain
      this.responseChain = await this.createResponseChain();

      this.initialized = true;
      console.log('LangChain SQL Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LangChain SQL Service:', error);
      throw error;
    }
  }

  /**
   * Create the SQL query generation chain with custom prompts
   */
  async createSqlChain() {
    // Custom prompt template for SQL generation
    const sqlPrompt = PromptTemplate.fromTemplate(`
You are a SQLite expert. Given an input question, create a syntactically correct SQLite query.

CRITICAL SECURITY RULES:
1. ALWAYS include "WHERE userId = '{userId}'" for user data isolation
2. NEVER use DROP, DELETE, INSERT, UPDATE, ALTER, CREATE, TRUNCATE operations
3. Use LIMIT to prevent large result sets (max 1000 rows)
4. Only query the allowed tables: User, File, Email, TrelloBoard, TrelloCard, Session

Database Schema:
{schema}

Question: {question}
User ID: {userId}

Generate ONLY the SQL query without any explanation or formatting:
`);

    // Create a simple chain that uses the LLM with our prompt
    const chain = RunnableSequence.from([
      sqlPrompt,
      this.llm,
      new StringOutputParser(),
    ]);

    return chain;
  }

  /**
   * Create the response generation chain
   */
  async createResponseChain() {
    const responsePrompt = PromptTemplate.fromTemplate(`
You are a helpful assistant that explains database query results in natural language.

Original Question: {question}
SQL Query: {query}
Query Results: {result}

Based on the SQL query results, provide a clear, conversational answer to the user's question.
If no results were found, explain that clearly.
Include relevant insights and patterns you notice in the data.
Be accurate and don't make up information not present in the results.

Answer:
`);

    const chain = RunnableSequence.from([
      responsePrompt,
      this.responseLlm,
      new StringOutputParser(),
    ]);

    return chain;
  }

  /**
   * Generate SQL query from natural language question
   * @param {string} question - User's natural language question
   * @param {string} userId - User ID for data isolation
   * @returns {Promise<{sql: string, explanation: string}>}
   */
  async generateSql(question, userId) {
    await this.initialize();

    try {
      // Get database schema
      const schema = await this.getSchemaInfo();

      // Generate SQL query
      const sql = await this.sqlChain.invoke({
        question,
        userId,
        schema,
      });

      // Validate and sanitize the generated SQL
      const validatedSql = this.validateAndSanitizeSql(sql, userId);

      return {
        sql: validatedSql,
        explanation: `Generated SQL query to answer: "${question}"`,
      };
    } catch (error) {
      console.error('Error generating SQL:', error);
      throw new Error(`Failed to generate SQL query: ${error.message}`);
    }
  }

  /**
   * Execute SQL query and generate natural language response
   * @param {string} question - Original user question
   * @param {string} sql - SQL query to execute
   * @param {string} userId - User ID for validation
   * @returns {Promise<{results: any[], response: string}>}
   */
  async executeAndRespond(question, sql, userId) {
    await this.initialize();

    try {
      // Execute the SQL query using Prisma
      const results = await this.prisma.$queryRawUnsafe(sql);

      // Generate natural language response
      const response = await this.responseChain.invoke({
        question,
        query: sql,
        result: this.formatResultsForLLM(results),
      });

      return {
        results: results,
        response: response.trim(),
      };
    } catch (error) {
      console.error('Error executing SQL or generating response:', error);
      throw new Error(`Failed to execute query: ${error.message}`);
    }
  }

  /**
   * Complete nl-to-sql pipeline: generate, execute, and respond
   * @param {string} question - User's natural language question
   * @param {string} userId - User ID for data isolation
   * @returns {Promise<{sql: string, results: any[], response: string, explanation: string}>}
   */
  async processQuery(question, userId) {
    await this.initialize();

    try {
      // Step 1: Generate SQL
      const { sql, explanation } = await this.generateSql(question, userId);

      // Step 2: Execute and get response
      const { results, response } = await this.executeAndRespond(question, sql, userId);

      return {
        sql,
        results,
        response,
        explanation,
        resultCount: Array.isArray(results) ? results.length : 1,
      };
    } catch (error) {
      console.error('Error in complete NL-to-SQL pipeline:', error);
      throw error;
    }
  }

  /**
   * Get database schema information
   */
  async getSchemaInfo() {
    try {
      // For now, use the hardcoded schema since we're using Prisma
      // In the future, we could introspect the Prisma schema
      return this.getFallbackSchema();
    } catch (error) {
      console.error('Error getting schema info:', error);
      return this.getFallbackSchema();
    }
  }

  /**
   * Fallback schema information
   */
  getFallbackSchema() {
    return `
Tables:
- User: id, email, name, googleAccessToken, googleRefreshToken, trelloApiKey, trelloToken, createdAt, updatedAt
- File: id, googleId, name, mimeType, size, webViewLink, owners, modifiedAt, createdAt, userId
- Email: id, googleId, threadId, subject, sender, recipient, body, snippet, isRead, isImportant, receivedAt, createdAt, userId
- TrelloBoard: id, trelloId, name, url, userId
- TrelloCard: id, trelloId, name, description, url, listName, listId, status, priority, position, dueDate, createdAt, updatedAt, boardId, userId
- Session: id, sessionId, userId, email, name, createdAt, lastAccessed, expiresAt

All user data tables have userId foreign key for data isolation.
`;
  }

  /**
   * Enhanced validate and sanitize SQL query
   * Combines LangChain benefits with comprehensive security from original implementation
   */
  validateAndSanitizeSql(sql, userId) {
    let sanitized = sql.trim();

    // 1. Remove any SQL formatting (LangChain enhancement)
    sanitized = sanitized.replace(/^```sql\s*|\s*```$/g, '');
    sanitized = sanitized.replace(/^```\s*|\s*```$/g, '');

    // 2. Basic SQL validation
    this.performBasicValidation(sanitized);

    // 3. Check for forbidden operations (enhanced list)
    this.checkForbiddenOperations(sanitized);

    // 4. Validate table access
    this.validateTableAccess(sanitized);

    // 5. Ensure user isolation (enhanced pattern matching)
    this.validateUserIsolation(sanitized, userId);

    // 6. Add safety limits
    sanitized = this.addSafetyLimits(sanitized);

    return sanitized;
  }

  /**
   * Perform basic SQL syntax validation
   */
  performBasicValidation(sql) {
    if (!sql || typeof sql !== 'string') {
      throw new Error('SQL query is required and must be a string');
    }

    if (sql.length > 5000) {
      throw new Error('SQL query is too long (max 5000 characters)');
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of sql) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) {
        throw new Error('Unbalanced parentheses in SQL query');
      }
    }
    if (parenCount !== 0) {
      throw new Error('Unbalanced parentheses in SQL query');
    }

    // Must start with SELECT
    if (!sql.trim().toUpperCase().startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed');
    }
  }

  /**
   * Check for forbidden SQL operations (enhanced)
   */
  checkForbiddenOperations(sql) {
    const forbiddenKeywords = [
      'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE',
      'REPLACE', 'PRAGMA', 'ATTACH', 'DETACH', 'VACUUM'
    ];
    const upperSql = sql.toUpperCase();

    for (const keyword of forbiddenKeywords) {
      if (upperSql.includes(keyword)) {
        throw new Error(`Forbidden SQL operation: ${keyword}`);
      }
    }

    // Check for dangerous functions
    const dangerousFunctions = ['LOAD_EXTENSION', 'SYSTEM', 'EXEC'];
    for (const func of dangerousFunctions) {
      if (upperSql.includes(func)) {
        throw new Error(`Dangerous function not allowed: ${func}`);
      }
    }
  }

  /**
   * Validate that only allowed tables are accessed
   */
  validateTableAccess(sql) {
    const allowedTables = ['User', 'File', 'Email', 'TrelloBoard', 'TrelloCard', 'Session'];

    // Extract table names from FROM and JOIN clauses
    const tablePattern = /\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    const matches = [...sql.matchAll(tablePattern)];

    for (const match of matches) {
      const tableName = match[1];
      if (!allowedTables.includes(tableName)) {
        throw new Error(`Access to table '${tableName}' is not allowed`);
      }
    }
  }

  /**
   * Validate that user isolation is enforced (enhanced)
   */
  validateUserIsolation(sql, userId) {
    const userDataTables = ['File', 'Email', 'TrelloBoard', 'TrelloCard'];
    const upperSql = sql.toUpperCase();

    for (const table of userDataTables) {
      if (upperSql.includes(table.toUpperCase())) {
        // Enhanced pattern matching for userId filter
        const userIdPattern = new RegExp(`\\bUSERID\\s*=\\s*['"]?${userId}['"]?`, 'i');
        if (!userIdPattern.test(sql)) {
          throw new Error(`Missing userId filter for table ${table}. All user data queries must include WHERE userId = '${userId}'`);
        }
      }
    }
  }

  /**
   * Add safety limits to the query
   */
  addSafetyLimits(sql) {
    let sanitized = sql.trim();
    const maxResultLimit = 1000;

    // Add LIMIT if not present
    if (!sanitized.toUpperCase().includes('LIMIT')) {
      sanitized += ` LIMIT ${maxResultLimit}`;
    } else {
      // Ensure LIMIT is not too high
      const limitMatch = sanitized.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        const limit = parseInt(limitMatch[1]);
        if (limit > maxResultLimit) {
          sanitized = sanitized.replace(/LIMIT\s+\d+/i, `LIMIT ${maxResultLimit}`);
        }
      }
    }

    return sanitized;
  }

  /**
   * Format results for LLM consumption
   */
  formatResultsForLLM(results) {
    if (!results || results.length === 0) {
      return 'No results found.';
    }

    if (results.length === 1) {
      const row = results[0];
      return Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }

    // For multiple rows, create a summary
    const maxRows = Math.min(results.length, 10);
    const headers = Object.keys(results[0]);
    
    let formatted = `Found ${results.length} results. First ${maxRows} rows:\n`;
    
    for (let i = 0; i < maxRows; i++) {
      const row = results[i];
      const rowData = headers.map(header => `${header}: ${row[header]}`).join(', ');
      formatted += `Row ${i + 1}: ${rowData}\n`;
    }

    if (results.length > maxRows) {
      formatted += `... and ${results.length - maxRows} more rows`;
    }

    return formatted;
  }

  /**
   * Health check for the service
   */
  async healthCheck() {
    try {
      await this.initialize();

      // Test basic functionality with Prisma
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'healthy',
        initialized: this.initialized,
        database: 'connected',
        chains: 'ready',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        initialized: this.initialized,
      };
    }
  }
}

export default LangChainSqlService;
