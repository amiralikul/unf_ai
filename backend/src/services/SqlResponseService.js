/**
 * Service to process SQL results and generate natural language responses
 */
export class SqlResponseService {
  constructor(openai) {
    this.openai = openai;
  }

  /**
   * Generate natural language response from SQL results
   * @param {string} originalQuestion - User's original question
   * @param {string} sql - SQL query that was executed
   * @param {Array} results - Results from SQL execution
   * @param {string} sqlExplanation - Explanation of what the SQL does
   * @returns {Promise<string>} Natural language response
   */
  async generateResponse(originalQuestion, sql, results, sqlExplanation) {
    const formattedResults = this.formatResults(results);
    const prompt = this.buildResponsePrompt(originalQuestion, sql, formattedResults, sqlExplanation);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that explains data query results in natural language.
          
Your job is to:
1. Answer the user's question based on the SQL results
2. Provide insights and context about the data
3. Format the response in a clear, readable way
4. Include relevant details and patterns you notice
5. If no results were found, explain that clearly

Be conversational but accurate. Don't make up information not present in the results.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    return completion.choices[0].message.content;
  }

  /**
   * Format SQL results for LLM consumption
   * @param {Array} results - Raw SQL results
   * @returns {string} Formatted results
   */
  formatResults(results) {
    if (!results || results.length === 0) {
      return 'No results found.';
    }

    // If results is a single row, format as key-value pairs
    if (results.length === 1) {
      const row = results[0];
      const formatted = Object.entries(row)
        .map(([key, value]) => `${key}: ${this.formatValue(value)}`)
        .join('\n');
      return `Result (1 row):\n${formatted}`;
    }

    // For multiple rows, create a table-like format
    const headers = Object.keys(results[0]);
    const maxRows = Math.min(results.length, 50); // Limit display to 50 rows
    
    let formatted = `Results (${results.length} rows, showing first ${maxRows}):\n\n`;
    
    // Add headers
    formatted += headers.join(' | ') + '\n';
    formatted += headers.map(() => '---').join(' | ') + '\n';
    
    // Add rows
    for (let i = 0; i < maxRows; i++) {
      const row = results[i];
      const rowValues = headers.map(header => this.formatValue(row[header]));
      formatted += rowValues.join(' | ') + '\n';
    }

    if (results.length > maxRows) {
      formatted += `\n... and ${results.length - maxRows} more rows`;
    }

    return formatted;
  }

  /**
   * Format individual values for display
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  formatValue(value) {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (typeof value === 'string') {
      // Truncate long strings
      return value.length > 100 ? `${value.substring(0, 100)}...` : value;
    }
    
    if (typeof value === 'number') {
      // Format large numbers with commas
      return value.toLocaleString();
    }
    
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    // Handle dates stored as strings
    if (typeof value === 'string' && this.isDateString(value)) {
      try {
        const date = new Date(value);
        return date.toISOString().split('T')[0];
      } catch {
        return value;
      }
    }
    
    return String(value);
  }

  /**
   * Check if a string represents a date
   * @param {string} str - String to check
   * @returns {boolean} True if string is a date
   */
  isDateString(str) {
    // Check for ISO date format or common date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ // ISO datetime
    ];
    
    return datePatterns.some(pattern => pattern.test(str));
  }

  /**
   * Build prompt for response generation
   * @param {string} question - Original user question
   * @param {string} sql - SQL query
   * @param {string} formattedResults - Formatted results
   * @param {string} sqlExplanation - SQL explanation
   * @returns {string} Complete prompt
   */
  buildResponsePrompt(question, sql, formattedResults, sqlExplanation) {
    return `
USER QUESTION: ${question}

SQL QUERY EXECUTED: ${sql}

WHAT THE QUERY DOES: ${sqlExplanation}

QUERY RESULTS:
${formattedResults}

Please provide a natural language answer to the user's question based on these results. Be helpful and conversational while staying accurate to the data shown.
`.trim();
  }

  /**
   * Analyze results and provide insights
   * @param {Array} results - SQL results
   * @returns {object} Analysis insights
   */
  analyzeResults(results) {
    if (!results || results.length === 0) {
      return {
        rowCount: 0,
        hasData: false,
        insights: []
      };
    }

    const insights = [];
    const rowCount = results.length;

    // Basic insights
    if (rowCount === 1) {
      insights.push('Single result found');
    } else if (rowCount > 100) {
      insights.push('Large result set - showing summarized data');
    }

    // Analyze data types and patterns
    if (results.length > 0) {
      const firstRow = results[0];
      const columns = Object.keys(firstRow);
      
      // Check for date columns
      const dateColumns = columns.filter(col => 
        this.isDateString(String(firstRow[col]))
      );
      if (dateColumns.length > 0) {
        insights.push(`Contains date/time data in: ${dateColumns.join(', ')}`);
      }

      // Check for numeric aggregations
      const numericColumns = columns.filter(col => 
        typeof firstRow[col] === 'number'
      );
      if (numericColumns.length > 0) {
        insights.push(`Contains numeric data in: ${numericColumns.join(', ')}`);
      }
    }

    return {
      rowCount,
      hasData: true,
      insights
    };
  }
}

export default SqlResponseService;