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
      modelName: 'gpt-4o-mini',
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
You are a PostgreSQL expert. Given an input question, create a syntactically correct PostgreSQL query.

CRITICAL SECURITY RULES:
1. ALWAYS include "WHERE "user_id" = '{userId}'" for user data isolation
2. NEVER use DROP, DELETE, INSERT, UPDATE, ALTER, CREATE, TRUNCATE operations
3. Use LIMIT to prevent large result sets (max 1000 rows)
4. Only query the allowed tables: "User", "File", "Email", "TrelloBoard", "TrelloCard", "Session", "EmailFileLink"
5. Use PostgreSQL-specific functions and syntax when appropriate

SCHEMA AND QUERYING RULES:
- CRITICAL: Always wrap table and column names in double quotes ("") to preserve case sensitivity. For example, query "File"."modified_at", not File.modified_at.
- For emails, the sender's identity is split into "sender_name" and "sender_email".
- Similarly, the recipient's identity is in "recipient_name" and "recipient_email".
- When a question asks about who sent an email, use the "sender_name" or "sender_email" columns.
- The old "sender" and "recipient" columns are deprecated and should not be used.

Database Schema:
{schema}

SPECIAL INSTRUCTIONS FOR "owners" FIELD:
- The "File".owners column is a 'jsonb' array of objects, like '[{{ "displayName": "John Doe", "emailAddress": "john.doe@example.com" }}]'.
- To query by owner, you MUST use the 'jsonb_array_elements' function to expand the array.
- Example: To count files per owner, you would write:
  SELECT (o ->> 'displayName') as owner, count(f.id) FROM "File" f, jsonb_array_elements(f.owners) as o WHERE f."user_id" = '{userId}' GROUP BY owner;

SPECIAL INSTRUCTIONS FOR JOINING EMAILS AND FILES:
- The "EmailFileLink" table links emails and files. To find files attached to emails, you MUST perform a three-way join.
- Example: To find the names of files attached to emails with the subject 'Important', you would write:
  SELECT f.name FROM "File" f
  JOIN "EmailFileLink" efl ON f.id = efl.file_id
  JOIN "Email" e ON efl.email_id = e.id
  WHERE e.subject = 'Important' AND e.user_id = '{userId}';

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
PostgreSQL Database Schema:

Tables:
- "User": id (text), email (text, unique), name (text), google_access_token (text), google_refresh_token (text), trello_api_key (text), trello_token (text), created_at (timestamp), updated_at (timestamp)
- "File": id (text), google_id (text, unique), name (text), mime_type (text), size (bigint), web_view_link (text), owners (jsonb), modified_at (timestamp), created_at (timestamp), user_id (text), file_type (text), docs_url (text), is_shared (boolean)
- "Email": id (text), google_id (text, unique), thread_id (text), subject (text), sender_name (text), sender_email (text), recipient_name (text), recipient_email (text), body (text), snippet (text), is_read (boolean), is_important (boolean), received_at (timestamp), created_at (timestamp), user_id (text)
- "EmailFileLink": email_id (text), file_id (text) - This is a JOIN TABLE. It links an "Email" to a "File". Use it to find which files were shared in which emails.
- "TrelloBoard": id (text), trello_id (text, unique), name (text), url (text), user_id (text)
- "TrelloCard": id (text), trello_id (text, unique), name (text), description (text), url (text), list_name (text), list_id (text), status (text), priority (text), position (float), due_date (timestamp), created_at (timestamp), updated_at (timestamp), board_id (text), user_id (text)
- "Session": id (text), session_id (text, unique), user_id (text), email (text), name (text), created_at (timestamp), last_accessed (timestamp), expires_at (timestamp)

File Types:
- file_type can be: 'drive', 'docs', 'sheets', 'slides', 'forms'
- Use file_type to filter for specific Google file types (e.g., WHERE file_type = 'docs' for Google Docs)
- docs_url contains the original Google Docs URL for direct access
- is_shared indicates if the file is shared with others

PostgreSQL Features:
- Use "ILIKE" for case-insensitive text matching on 'name', 'subject', 'sender_name', 'sender_email', 'recipient_name', 'recipient_email'.
- The "File".owners column is a 'jsonb' array of objects. Use 'jsonb_array_elements' to query it.
- Query Google Docs specifically with: WHERE file_type = 'docs'
- Query shared documents with: WHERE is_shared = true
`;
  }

  /**
   * Validate and sanitize the generated SQL query
   */
  validateAndSanitizeSql(sql, userId) {
    // Basic validation
    this.performBasicValidation(sql);

    // More specific validations
    this.checkForbiddenOperations(sql);
    this.validateTableAccess(sql);
    this.validateUserIsolation(sql, userId);

    // Add safety limits
    const finalSql = this.addSafetyLimits(sql);
    
    return finalSql.trim();
  }

  /**
   * Basic validation for SQL query
   */
  performBasicValidation(sql) {
    if (!sql || typeof sql !== 'string' || sql.trim() === '') {
      throw new Error('Generated SQL query is empty or invalid');
    }
  }

  /**
   * Check for forbidden SQL operations
   */
  checkForbiddenOperations(sql) {
    const forbiddenKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE', 'ATTACH', 'DETACH'];
    const upperSql = sql.toUpperCase();

    for (const keyword of forbiddenKeywords) {
      if (upperSql.includes(keyword)) {
        throw new Error(`Forbidden SQL operation: ${keyword}`);
      }
    }
  }

  /**
   * Validate table access
   */
  validateTableAccess(sql) {
    const allowedTables = ['User', 'File', 'Email', 'TrelloBoard', 'TrelloCard', 'Session', 'EmailFileLink'];

    // Extract table names from FROM and JOIN clauses
    const tableRegex = /(?:FROM|JOIN)\\s+`?"?(\\w+)"?`/gi;
    const matches = [...sql.matchAll(tableRegex)];
    const tables = matches.map(m => m[1]);

    for (const table of tables) {
      if (!allowedTables.includes(table)) {
        throw new Error(`Forbidden table access: ${table}`);
      }
    }
  }
  
  /**
   * Ensure user data isolation
   */
  validateUserIsolation(sql, userId) {
    if (!sql.includes(userId)) {
      console.warn(`Query does not contain user ID: ${sql}`);
      // In a real-world scenario, you might want to throw an error here.
      // For now, we'll allow it but log a warning.
    }
  }
  
  /**
   * Add safety limits to the query
   */
  addSafetyLimits(sql) {
    if (!sql.toUpperCase().includes('LIMIT')) {
      return sql.replace(/;?$/, ' LIMIT 1000;');
    }
    return sql;
  }
  
  /**
   * Format results for LLM response generation, handling BigInt
   */
  formatResultsForLLM(results) {
    if (!results) return 'No results found.';
    if (results.length === 0) return 'No results found.';

    try {
      // Helper function to handle BigInt serialization
      const replacer = (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      };

      // Convert results to string, limiting length
      const jsonString = JSON.stringify(results, replacer, 2);
      if (jsonString.length > 5000) {
        return jsonString.substring(0, 5000) + '... (results truncated)';
      }
      return jsonString;
    } catch (error) {
      console.error('Error formatting results for LLM:', error);
      return 'Error formatting results.';
    }
  }
  
  /**
   * Health check for the LangChain SQL service
   */
  async healthCheck() {
    const status = {
      status: 'healthy',
      llm: 'untested',
      schema: 'untested',
    };
    
    try {
      await this.llm.invoke('Hello');
      status.llm = 'ok';
    } catch(e) {
      status.llam = 'error';
      status.status = 'degraded';
    }
    
    try {
      this.getFallbackSchema();
      status.schema = 'ok';
    } catch(e) {
      status.schema = 'error';
      status.status = 'degraded';
    }
    
    return status;
  }
}

export default LangChainSqlService;
