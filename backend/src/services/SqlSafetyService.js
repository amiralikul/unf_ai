/**
 * Service to validate and sanitize SQL queries before execution
 */
export class SqlSafetyService {
  constructor() {
    this.allowedTables = ['User', 'File', 'Email', 'TrelloBoard', 'TrelloCard', 'Session'];
    this.forbiddenKeywords = [
      'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE',
      'REPLACE', 'PRAGMA', 'ATTACH', 'DETACH', 'VACUUM'
    ];
    this.maxResultLimit = 1000;
  }

  /**
   * Validate and sanitize SQL query
   * @param {string} sql - SQL query to validate
   * @param {string} userId - User ID that should be in the query
   * @returns {object} Validation result with sanitized SQL
   */
  validateQuery(sql, userId) {
    const result = {
      isValid: false,
      sanitizedSql: null,
      errors: [],
      warnings: []
    };

    try {
      // Basic SQL validation
      const validation = this.performBasicValidation(sql);
      if (!validation.isValid) {
        result.errors = validation.errors;
        return result;
      }

      // Check for forbidden operations
      const forbiddenCheck = this.checkForbiddenOperations(sql);
      if (!forbiddenCheck.isValid) {
        result.errors = forbiddenCheck.errors;
        return result;
      }

      // Validate table access
      const tableCheck = this.validateTableAccess(sql);
      if (!tableCheck.isValid) {
        result.errors = tableCheck.errors;
        return result;
      }

      // Validate user isolation
      const userCheck = this.validateUserIsolation(sql, userId);
      if (!userCheck.isValid) {
        result.errors = userCheck.errors;
        return result;
      }

      // Add safety limits
      const sanitizedSql = this.addSafetyLimits(sql);

      result.isValid = true;
      result.sanitizedSql = sanitizedSql;
      result.warnings = this.getWarnings(sql);

      return result;

    } catch (error) {
      result.errors = [`SQL validation error: ${error.message}`];
      return result;
    }
  }

  /**
   * Perform basic SQL syntax validation
   * @param {string} sql - SQL query
   * @returns {object} Validation result
   */
  performBasicValidation(sql) {
    const errors = [];

    if (!sql || typeof sql !== 'string') {
      errors.push('SQL query is required and must be a string');
    }

    if (sql.length > 5000) {
      errors.push('SQL query is too long (max 5000 characters)');
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of sql) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) {
        errors.push('Unbalanced parentheses in SQL query');
        break;
      }
    }
    if (parenCount !== 0) {
      errors.push('Unbalanced parentheses in SQL query');
    }

    // Must start with SELECT
    if (!sql.trim().toUpperCase().startsWith('SELECT')) {
      errors.push('Only SELECT queries are allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for forbidden SQL operations
   * @param {string} sql - SQL query
   * @returns {object} Validation result
   */
  checkForbiddenOperations(sql) {
    const errors = [];
    const upperSql = sql.toUpperCase();

    for (const keyword of this.forbiddenKeywords) {
      if (upperSql.includes(keyword)) {
        errors.push(`Forbidden SQL operation: ${keyword}`);
      }
    }

    // Check for dangerous functions
    const dangerousFunctions = ['LOAD_EXTENSION', 'SYSTEM', 'EXEC'];
    for (const func of dangerousFunctions) {
      if (upperSql.includes(func)) {
        errors.push(`Dangerous function not allowed: ${func}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate that only allowed tables are accessed
   * @param {string} sql - SQL query
   * @returns {object} Validation result
   */
  validateTableAccess(sql) {
    const errors = [];
    
    // Extract table names from FROM and JOIN clauses
    const tablePattern = /\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    const matches = [...sql.matchAll(tablePattern)];
    
    for (const match of matches) {
      const tableName = match[1];
      if (!this.allowedTables.includes(tableName)) {
        errors.push(`Access to table '${tableName}' is not allowed`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate that user isolation is enforced
   * @param {string} sql - SQL query
   * @param {string} userId - User ID
   * @returns {object} Validation result
   */
  validateUserIsolation(sql, userId) {
    const errors = [];
    
    // Check if userId filter is present for user data tables
    const userDataTables = ['File', 'Email', 'TrelloBoard', 'TrelloCard'];
    const upperSql = sql.toUpperCase();
    
    for (const table of userDataTables) {
      if (upperSql.includes(table.toUpperCase())) {
        // Check if userId filter exists
        const userIdPattern = new RegExp(`\\bUSERID\\s*=\\s*['"]?${userId}['"]?`, 'i');
        if (!userIdPattern.test(sql)) {
          errors.push(`Missing userId filter for table ${table}. All user data queries must include WHERE userId = '${userId}'`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Add safety limits to the query
   * @param {string} sql - Original SQL query
   * @returns {string} SQL with safety limits added
   */
  addSafetyLimits(sql) {
    let sanitized = sql.trim();
    
    // Add LIMIT if not present
    if (!sanitized.toUpperCase().includes('LIMIT')) {
      sanitized += ` LIMIT ${this.maxResultLimit}`;
    } else {
      // Ensure LIMIT is not too high
      const limitMatch = sanitized.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        const limit = parseInt(limitMatch[1]);
        if (limit > this.maxResultLimit) {
          sanitized = sanitized.replace(/LIMIT\s+\d+/i, `LIMIT ${this.maxResultLimit}`);
        }
      }
    }

    return sanitized;
  }

  /**
   * Get warnings for potentially problematic queries
   * @param {string} sql - SQL query
   * @returns {string[]} Array of warnings
   */
  getWarnings(sql) {
    const warnings = [];
    const upperSql = sql.toUpperCase();

    // Warn about potentially expensive operations
    if (upperSql.includes('GROUP BY') && !upperSql.includes('LIMIT')) {
      warnings.push('GROUP BY without LIMIT may return many results');
    }

    if (upperSql.includes('ORDER BY') && !upperSql.includes('LIMIT')) {
      warnings.push('ORDER BY without LIMIT may be slow on large datasets');
    }

    if (upperSql.includes('LIKE') && sql.includes('%')) {
      warnings.push('LIKE with wildcards may be slow on large datasets');
    }

    return warnings;
  }

  /**
   * Escape user input for SQL queries
   * @param {string} input - User input
   * @returns {string} Escaped input
   */
  escapeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Basic SQL injection prevention
    return input
      .replace(/'/g, "''")  // Escape single quotes
      .replace(/;/g, '')    // Remove semicolons
      .replace(/--/g, '')   // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comment start
      .replace(/\*\//g, ''); // Remove block comment end
  }
}

export default SqlSafetyService;