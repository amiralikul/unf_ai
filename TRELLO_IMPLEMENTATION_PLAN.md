# Implementation Plan: Advanced Analytics for LLM Queries

## Overview

This plan implements backend features to enable LLM-powered analytics that can answer complex cross-platform questions by establishing relationships between Trello cards, Google Drive files, and Gmail messages.

## Target Queries

1. **"Which Trello cards are linked to recently modified files?"**
2. **"What percentage of tasks have corresponding documents?"**
3. **"Are there overdue tasks with active email conversations?"**

## Current State Analysis

### Existing Schema Capabilities
- ✅ Files with modification timestamps (`File.modified_at`)
- ✅ Trello cards with due dates (`TrelloCard.due_date`)
- ✅ Emails with thread relationships (`Email.thread_id`, `Email.received_at`)
- ✅ Email-File links (`EmailFileLink`)

### Missing Relationships
- ❌ TrelloCard ↔ File connections
- ❌ TrelloCard ↔ Email connections

## Implementation Plan

### Phase 1: Database Schema Extensions

#### 1.1 Add TrelloCard-File Relationship Table

```prisma
model TrelloCardFileLink {
  id         String   @id @default(cuid())
  card_id    String
  file_id    String
  link_type  String   // 'attachment', 'reference', 'requirement', 'deliverable'
  created_at DateTime @default(now())
  created_by String?  // 'auto' or user_id for manual links
  
  card TrelloCard @relation(fields: [card_id], references: [id], onDelete: Cascade)
  file File       @relation(fields: [file_id], references: [id], onDelete: Cascade)
  
  @@unique([card_id, file_id])
  @@index([card_id])
  @@index([file_id])
  @@index([link_type])
  @@map("TrelloCardFileLink")
}
```

#### 1.2 Add TrelloCard-Email Relationship Table

```prisma
model TrelloCardEmailLink {
  id         String   @id @default(cuid())
  card_id    String
  email_id   String
  link_type  String   // 'discussion', 'update', 'notification', 'attachment'
  created_at DateTime @default(now())
  created_by String?  // 'auto' or user_id for manual links
  
  card  TrelloCard @relation(fields: [card_id], references: [id], onDelete: Cascade)
  email Email      @relation(fields: [email_id], references: [id], onDelete: Cascade)
  
  @@unique([card_id, email_id])
  @@index([card_id])
  @@index([email_id])
  @@index([link_type])
  @@map("TrelloCardEmailLink")
}
```

#### 1.3 Update Existing Models

Add relationship fields to existing models:

```prisma
// Add to TrelloCard model
model TrelloCard {
  // ... existing fields
  file_links  TrelloCardFileLink[]
  email_links TrelloCardEmailLink[]
}

// Add to File model  
model File {
  // ... existing fields
  card_links TrelloCardFileLink[]
}

// Add to Email model
model Email {
  // ... existing fields
  card_links TrelloCardEmailLink[]
}
```

### Phase 2: Link Detection Service

#### 2.1 Create Core Link Detection Service

**File: `backend/src/services/LinkDetectionService.js`**

```javascript
export class LinkDetectionService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // Detect Trello card references in text
  extractTrelloCardReferences(text) {
    const patterns = [
      /https:\/\/trello\.com\/c\/([a-zA-Z0-9]+)/g,
      /trello\.com\/c\/([a-zA-Z0-9]+)/g,
      /#([A-Z]+-\d+)/g, // Custom card IDs if used
    ];
    // Implementation details...
  }

  // Detect Google Drive file references in text
  extractDriveFileReferences(text) {
    const patterns = [
      /https:\/\/docs\.google\.com\/[^\/]+\/d\/([a-zA-Z0-9-_]+)/g,
      /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/g,
    ];
    // Implementation details...
  }

  // Create card-file links
  async linkCardToFile(cardId, fileId, linkType = 'reference', createdBy = 'auto') {
    // Implementation with duplicate prevention...
  }

  // Create card-email links
  async linkCardToEmail(cardId, emailId, linkType = 'discussion', createdBy = 'auto') {
    // Implementation with duplicate prevention...
  }
}
```

#### 2.2 Enhanced Sync Operations

**Update existing sync controllers to include link detection:**

**Gmail Sync Enhancement (`backend/src/controllers/gmail/syncMessages.js`):**
```javascript
// After saving email, detect Trello card references
const trelloRefs = linkDetectionService.extractTrelloCardReferences(email.body);
for (const trelloId of trelloRefs) {
  const card = await findCardByTrelloId(trelloId);
  if (card) {
    await linkDetectionService.linkCardToEmail(card.id, email.id, 'discussion');
  }
}
```

**Drive Sync Enhancement (`backend/src/controllers/drive/syncFiles.js`):**
```javascript
// Check if file is referenced in any Trello card descriptions
const cards = await prisma.trelloCard.findMany({
  where: { user_id: userId }
});

for (const card of cards) {
  const fileRefs = linkDetectionService.extractDriveFileReferences(card.description);
  if (fileRefs.includes(file.google_id)) {
    await linkDetectionService.linkCardToFile(card.id, file.id, 'reference');
  }
}
```

**Trello Sync Enhancement (`backend/src/controllers/trello/syncBoards.js`):**
```javascript
// After saving card, detect file and email references
const fileRefs = linkDetectionService.extractDriveFileReferences(card.description);
const emailRefs = linkDetectionService.extractEmailReferences(card.description);

// Link to existing files and emails
// Implementation details...
```

### Phase 3: Manual Linking API

#### 3.1 Manual Link Management Endpoints

**File: `backend/src/controllers/links/index.js`**

```javascript
export const createLinkControllers = (prisma) => ({
  // POST /api/links/card-file
  linkCardToFile: async (req, res) => {
    const { cardId, fileId, linkType } = req.body;
    // Validation and creation logic...
  },

  // POST /api/links/card-email  
  linkCardToEmail: async (req, res) => {
    const { cardId, emailId, linkType } = req.body;
    // Validation and creation logic...
  },

  // DELETE /api/links/card-file/:cardId/:fileId
  unlinkCardFromFile: async (req, res) => {
    // Deletion logic...
  },

  // GET /api/links/card/:cardId
  getCardLinks: async (req, res) => {
    // Return all links for a specific card...
  }
});
```

### Phase 4: LangChain Integration Update

#### 4.1 Update Schema Context

**File: `backend/src/services/LangChainSqlService.js`**

Update the database schema context to include new relationship tables:

```javascript
const DATABASE_SCHEMA = `
-- Existing tables...

-- Relationship Tables
CREATE TABLE TrelloCardFileLink (
  id VARCHAR PRIMARY KEY,
  card_id VARCHAR REFERENCES TrelloCard(id),
  file_id VARCHAR REFERENCES File(id), 
  link_type VARCHAR,
  created_at TIMESTAMP
);

CREATE TABLE TrelloCardEmailLink (
  id VARCHAR PRIMARY KEY,
  card_id VARCHAR REFERENCES TrelloCard(id),
  email_id VARCHAR REFERENCES Email(id),
  link_type VARCHAR, 
  created_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_cardfilelink_card ON TrelloCardFileLink(card_id);
CREATE INDEX idx_cardemaillink_card ON TrelloCardEmailLink(card_id);
`;
```

#### 4.2 Add Example Queries

```javascript
const EXAMPLE_QUERIES = `
-- Recently modified files linked to Trello cards
SELECT tc.name as card_name, f.name as file_name, f.modified_at
FROM TrelloCard tc
JOIN TrelloCardFileLink tcfl ON tc.id = tcfl.card_id  
JOIN File f ON tcfl.file_id = f.id
WHERE f.modified_at > NOW() - INTERVAL '7 days'
ORDER BY f.modified_at DESC;

-- Percentage of tasks with documents
SELECT 
  COUNT(DISTINCT tc.id) as total_tasks,
  COUNT(DISTINCT tcfl.card_id) as tasks_with_docs,
  ROUND(COUNT(DISTINCT tcfl.card_id) * 100.0 / COUNT(DISTINCT tc.id), 2) as coverage_percentage
FROM TrelloCard tc
LEFT JOIN TrelloCardFileLink tcfl ON tc.id = tcfl.card_id;

-- Overdue tasks with active email conversations
SELECT tc.name, tc.due_date, COUNT(e.id) as recent_email_count
FROM TrelloCard tc
JOIN TrelloCardEmailLink tcel ON tc.id = tcel.card_id
JOIN Email e ON tcel.email_id = e.id  
WHERE tc.due_date < NOW() 
  AND e.received_at > NOW() - INTERVAL '3 days'
GROUP BY tc.id, tc.name, tc.due_date
ORDER BY recent_email_count DESC;
`;
```

## Implementation Timeline

### Week 1: Database Foundation
- **Day 1-2**: Create Prisma migration with new relationship tables
- **Day 3**: Update schema, run migration, verify database structure
- **Day 4-5**: Build core `LinkDetectionService` with text parsing logic

### Week 2: Sync Integration  
- **Day 1-2**: Enhance Gmail sync with link detection
- **Day 3-4**: Enhance Drive sync with link detection  
- **Day 5**: Enhance Trello sync with link detection

### Week 3: APIs and Testing
- **Day 1-2**: Build manual linking API endpoints
- **Day 3-4**: Update LangChain service with new schema context
- **Day 5**: End-to-end testing with sample queries

## Success Metrics

### Data Population Metrics
- Number of auto-detected card-file links created
- Number of auto-detected card-email links created  
- Coverage percentage of cards with at least one link

### Query Performance Metrics
- Response time for complex analytical queries
- Accuracy of LLM-generated SQL for the target questions

### User Experience Metrics
- Successful natural language query processing
- Meaningful results returned for the three target questions

## Technical Considerations

### Performance Optimization
- Database indexes on all foreign keys and link types
- Batch processing for link detection during large syncs
- Caching for frequently accessed relationship data

### Data Quality
- Duplicate link prevention in link detection service
- Validation of file/email/card existence before linking
- Soft deletion support for maintaining link history

### Scalability
- Async processing for link detection during syncs
- Background jobs for periodic link validation and cleanup
- Rate limiting on manual linking APIs

## Risk Mitigation

### Data Integrity Risks
- **Risk**: Broken links due to external data changes
- **Mitigation**: Regular validation jobs, cascade deletes

### Performance Risks  
- **Risk**: Slow queries on large datasets
- **Mitigation**: Proper indexing, query optimization, pagination

### Detection Accuracy Risks
- **Risk**: False positive/negative link detection
- **Mitigation**: Conservative matching patterns, manual override capabilities

## Testing Strategy

### Unit Tests
- Link detection pattern matching
- Service method functionality
- Controller endpoint validation

### Integration Tests  
- End-to-end sync operations with link creation
- LangChain query generation with new schema
- API endpoint integration

### Performance Tests
- Large dataset query performance
- Concurrent sync operation handling
- Link detection processing speed

## Deployment Checklist

- [ ] Database migration executed successfully
- [ ] All sync services updated and tested
- [ ] Manual linking APIs deployed and documented
- [ ] LangChain service updated with new schema
- [ ] Performance monitoring in place
- [ ] Rollback plan prepared

This implementation will provide a robust foundation for LLM-powered analytics across the integrated platforms, enabling sophisticated cross-platform insights through natural language queries.