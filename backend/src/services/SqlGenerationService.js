/**
 * Service to generate SQL queries from natural language using OpenAI
 */
export class SqlGenerationService {
  constructor(openai) {
    this.openai = openai;
    this.schemaContext = this.getSchemaContext();
  }

  /**
   * Generate SQL query from natural language question
   * @param {string} question - User's natural language question
   * @param {string} userId - User ID for context
   * @returns {Promise<{sql: string, explanation: string}>} Generated SQL and explanation
   */
  async generateSql(question, userId) {
    const prompt = this.buildSqlPrompt(question, userId);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a SQL expert. Generate SQLite queries based on user questions.
          
CRITICAL RULES:
1. ALWAYS include "WHERE userId = ?" in queries that access user data
2. Use SQLite syntax only
3. Return ONLY valid SQL - no explanations in the SQL itself
4. Use proper table and column names from the schema
5. Handle dates with datetime() functions
6. Use LIMIT to prevent large result sets (max 100 rows)

Response format:
SQL: [your sql query here]
EXPLANATION: [brief explanation of what the query does]`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    return this.parseSqlResponse(completion.choices[0].message.content);
  }

  /**
   * Build prompt for SQL generation
   * @param {string} question - User question
   * @param {string} userId - User ID
   * @returns {string} Complete prompt
   */
  buildSqlPrompt(question, userId) {
    return `
${this.schemaContext}

USER QUESTION: ${question}

Generate a SQLite query to answer this question. Remember:
- Include WHERE userId = '${userId}' for user data isolation
- Use proper SQLite syntax and functions
- Limit results to reasonable amounts (LIMIT 100 max)
- Handle dates appropriately with datetime() functions
`.trim();
  }

  /**
   * Parse the LLM response to extract SQL and explanation
   * @param {string} response - Raw LLM response
   * @returns {object} Parsed SQL and explanation
   */
  parseSqlResponse(response) {
    const sqlMatch = response.match(/SQL:\s*(.+?)(?=EXPLANATION:|$)/s);
    const explanationMatch = response.match(/EXPLANATION:\s*(.+)/s);

    const sql = sqlMatch ? sqlMatch[1].trim() : response.trim();
    const explanation = explanationMatch ? explanationMatch[1].trim() : 'Generated SQL query';

    return {
      sql: sql.replace(/^```sql\s*|\s*```$/g, '').trim(),
      explanation
    };
  }

  /**
   * Get database schema context for LLM
   * @returns {string} Schema description
   */
  getSchemaContext() {
    return `
DATABASE SCHEMA (SQLite):

User Table:
- id (String, Primary Key)
- email (String, Unique)
- name (String)
- createdAt, updatedAt (DateTime)

File Table (Google Drive files):
- id (String, Primary Key)
- googleId (String, Unique)
- name (String) - filename
- mimeType (String) - file type
- size (Integer) - bytes
- webViewLink (String) - Google Drive URL
- modifiedAt (DateTime) - last modified
- createdAt (DateTime)
- userId (String, Foreign Key)

Email Table (Gmail messages):
- id (String, Primary Key)
- googleId (String, Unique)
- threadId (String)
- subject (String)
- sender (String) - email address
- recipient (String) - email address
- body (String) - email content
- snippet (String) - preview text
- isRead (Boolean)
- isImportant (Boolean)
- receivedAt (DateTime)
- createdAt (DateTime)
- userId (String, Foreign Key)

TrelloBoard Table:
- id (String, Primary Key)
- trelloId (String, Unique)
- name (String) - board name
- url (String)
- userId (String, Foreign Key)

TrelloCard Table:
- id (String, Primary Key)
- trelloId (String, Unique)
- name (String) - card title
- description (String)
- url (String)
- listName (String) - list the card is in
- status (String) - "To Do", "In Progress", "Review", "Done"
- priority (String) - "Low", "Medium", "High"
- dueDate (DateTime)
- createdAt (DateTime)
- updatedAt (DateTime)
- boardId (String, Foreign Key to TrelloBoard)
- userId (String, Foreign Key)

RELATIONSHIPS:
- User → File (1:many)
- User → Email (1:many)
- User → TrelloBoard (1:many)
- User → TrelloCard (1:many)
- TrelloBoard → TrelloCard (1:many)

EXAMPLE QUERIES:
- Recent files: SELECT name, mimeType, modifiedAt FROM File WHERE userId = ? ORDER BY modifiedAt DESC LIMIT 10
- Unread emails: SELECT subject, sender, receivedAt FROM Email WHERE userId = ? AND isRead = false
- Overdue cards: SELECT name, dueDate FROM TrelloCard WHERE userId = ? AND dueDate < datetime('now') AND status != 'Done'
- File storage by type: SELECT mimeType, COUNT(*), SUM(size) FROM File WHERE userId = ? GROUP BY mimeType
`.trim();
  }
}

export default SqlGenerationService;