# LangChain NL-to-SQL Implementation

This document describes the alternative LangChain-based implementation for natural language to SQL conversion, providing enhanced capabilities over the original OpenAI-based approach.

## Overview

The LangChain implementation offers several advantages:

- **Dynamic Schema Introspection**: Automatically discovers database structure
- **Advanced Prompt Engineering**: Uses LangChain's sophisticated prompt templates
- **Built-in SQL Safety**: Leverages LangChain's native SQL validation
- **Better Error Handling**: More robust error recovery and fallback mechanisms
- **Modular Architecture**: Easier to extend and customize

## Architecture

### Core Components

1. **LangChainSqlService** (`backend/src/services/LangChainSqlService.js`)
   - Main service class handling the complete NL-to-SQL pipeline
   - Uses LangChain's `SqlDatabase` for database interaction
   - Implements custom prompt templates for better SQL generation

2. **LangChain Controllers** (`backend/src/controllers/ai/langchainNlToSqlController.js`)
   - Express route handlers for LangChain endpoints
   - Includes comparison functionality between implementations
   - Enhanced error handling and logging

3. **API Routes** (added to `backend/src/api/ai.js`)
   - `/api/ai/langchain/nl-to-sql` - LangChain-based query processing
   - `/api/ai/langchain/nl-to-sql/health` - Health check endpoint
   - `/api/ai/compare/nl-to-sql` - Side-by-side comparison

## Key Features

### 1. Dynamic Schema Discovery

Unlike the original implementation with hardcoded schema, LangChain automatically introspects the database:

```javascript
// Automatic schema discovery
this.db = await SqlDatabase.fromDataSourceParams({
  appDataSource: {
    type: 'sqlite',
    database: this.databaseUrl.replace('file:', ''),
  },
});

const schema = await this.db.getTableInfo();
```

### 2. Advanced Prompt Engineering

Uses LangChain's `PromptTemplate` for more sophisticated prompt construction:

```javascript
const sqlPrompt = PromptTemplate.fromTemplate(`
You are a SQLite expert. Given an input question, create a syntactically correct SQLite query.

CRITICAL SECURITY RULES:
1. ALWAYS include "WHERE userId = '{userId}'" for user data isolation
2. NEVER use DROP, DELETE, INSERT, UPDATE, ALTER, CREATE, TRUNCATE operations
3. Use LIMIT to prevent large result sets (max 1000 rows)

Database Schema:
{schema}

Question: {question}
User ID: {userId}

Generate ONLY the SQL query without any explanation or formatting:
`);
```

### 3. Chain-based Processing

Utilizes LangChain's chain abstraction for modular processing:

```javascript
// SQL generation chain
this.sqlChain = await createSqlQueryChain({
  llm: this.llm,
  db: this.db,
  prompt: sqlPrompt,
});

// Response generation chain
this.responseChain = RunnableSequence.from([
  responsePrompt,
  this.responseLlm,
  new StringOutputParser(),
]);
```

### 4. Enhanced Safety Validation

Combines LangChain's built-in safety with custom validation:

```javascript
validateAndSanitizeSql(sql, userId) {
  // Remove formatting
  let sanitized = sql.replace(/^```sql\s*|\s*```$/g, '');
  
  // Ensure user isolation
  if (!sanitized.toLowerCase().includes(`userid = '${userId}'`)) {
    throw new Error('Query must include user ID filter for data isolation');
  }
  
  // Check forbidden operations
  const forbiddenKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER'];
  // ... validation logic
  
  return sanitized;
}
```

## API Endpoints

### 1. LangChain NL-to-SQL Query

**POST** `/api/ai/langchain/nl-to-sql`

```json
{
  "question": "How many files do I have?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "How many files do I have?",
    "answer": "You have 42 files in your account.",
    "sql": {
      "query": "SELECT COUNT(*) as count FROM File WHERE userId = 'user123' LIMIT 1000",
      "explanation": "Generated SQL query to answer: \"How many files do I have?\"",
      "resultCount": 1
    },
    "method": "langchain",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Health Check

**GET** `/api/ai/langchain/nl-to-sql/health`

**Response:**
```json
{
  "success": true,
  "data": {
    "healthy": true,
    "checks": {
      "openaiKey": true,
      "databaseUrl": true,
      "prisma": true,
      "langchainService": true,
      "langchainDetails": {
        "status": "healthy",
        "initialized": true,
        "database": "connected",
        "chains": "ready"
      }
    },
    "method": "langchain",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Implementation Comparison

**POST** `/api/ai/compare/nl-to-sql`

```json
{
  "question": "Show me my recent emails"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "Show me my recent emails",
    "original": {
      "sql": "SELECT subject, sender, receivedAt FROM Email WHERE userId = 'user123' ORDER BY receivedAt DESC LIMIT 10",
      "explanation": "Query to get recent emails",
      "resultCount": 5,
      "response": "You have 5 recent emails...",
      "success": true
    },
    "langchain": {
      "sql": "SELECT subject, sender, receivedAt FROM Email WHERE userId = 'user123' ORDER BY receivedAt DESC LIMIT 1000",
      "explanation": "Generated SQL query to answer: \"Show me my recent emails\"",
      "resultCount": 5,
      "response": "Based on your recent emails...",
      "success": true
    },
    "comparison": {
      "sqlSimilarity": false,
      "resultCountMatch": true,
      "bothSuccessful": true
    }
  }
}
```

## Frontend Integration

### React Component

A test component is provided at `frontend/src/components/LangChainSQLTest.jsx` that allows:

- Testing individual implementations
- Side-by-side comparison
- Health status monitoring
- Sample query testing

### API Client Methods

New methods added to `frontend/src/lib/api.js`:

```javascript
// LangChain NL to SQL queries
queryLangChainNLToSQL: (question) => {
  return apiClient.post('/api/ai/langchain/nl-to-sql', { question });
},
getLangChainNLToSQLHealth: () => apiClient.get('/api/ai/langchain/nl-to-sql/health'),

// Compare implementations
compareNLToSQL: (question) => {
  return apiClient.post('/api/ai/compare/nl-to-sql', { question });
},
```

## Testing

### Backend Testing

Run the test script to verify the LangChain service:

```bash
cd backend
node test-langchain-sql.js
```

### Frontend Testing

1. Import the test component in your app
2. Navigate to the test page
3. Try sample queries or enter custom questions
4. Compare results between implementations

## Comparison: Original vs LangChain

| Feature | Original Implementation | LangChain Implementation |
|---------|------------------------|--------------------------|
| Schema Handling | Hardcoded schema context | Dynamic schema introspection |
| Prompt Engineering | Basic string templates | Advanced LangChain prompts |
| SQL Safety | Custom validation service | Built-in + custom validation |
| Error Handling | Basic try-catch | Enhanced with fallbacks |
| Extensibility | Monolithic services | Modular chain architecture |
| Performance | Direct OpenAI calls | Optimized chain execution |
| Debugging | Limited visibility | Better chain introspection |

## Benefits of LangChain Approach

1. **Better SQL Generation**: More sophisticated prompt engineering leads to higher quality SQL
2. **Dynamic Adaptation**: Automatically adapts to schema changes
3. **Enhanced Safety**: Multiple layers of validation and safety checks
4. **Easier Maintenance**: Modular architecture makes updates simpler
5. **Better Error Recovery**: More robust handling of edge cases
6. **Future-Proof**: Easy to integrate new LangChain features

## Configuration

### Environment Variables

The same environment variables are used:
- `OPENAI_API_KEY` - OpenAI API key
- `DATABASE_URL` - SQLite database URL

### Dependencies

New dependencies added to `backend/package.json`:
- `langchain` - Core LangChain library
- `@langchain/openai` - OpenAI integration
- `@langchain/community` - Community tools and utilities

## Deployment Considerations

1. **Memory Usage**: LangChain may use slightly more memory due to chain initialization
2. **Cold Start**: Initial chain setup may take a few seconds on first request
3. **Caching**: Consider implementing chain caching for production use
4. **Monitoring**: Use LangChain's built-in tracing for debugging

## Future Enhancements

1. **Vector Similarity**: Add semantic search for better query understanding
2. **Query Caching**: Cache frequently asked questions
3. **Multi-Database**: Support for multiple database types
4. **Custom Tools**: Add domain-specific tools for better results
5. **Streaming**: Implement streaming responses for large result sets

## Conclusion

The LangChain implementation provides a more robust, maintainable, and feature-rich alternative to the original NL-to-SQL approach. While maintaining compatibility with existing functionality, it offers significant improvements in SQL generation quality, safety, and extensibility.
