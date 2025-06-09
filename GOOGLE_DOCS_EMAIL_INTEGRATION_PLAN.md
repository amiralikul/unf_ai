# Google Docs Email Integration Plan

## Overview
This plan outlines the implementation of Google Docs file type detection and integration for email attachments. Currently, the system only detects `drive.google.com` file links. This enhancement will add support for Google Workspace documents (Docs, Sheets, Slides, Forms) found in email bodies.

## Current State Analysis

### Existing Infrastructure
- **File Model**: `File` table stores Google Drive file metadata with `EmailFileLink` junction table
- **Email Parsing**: `GoogleOAuthService.js:143-155` extracts `drive.google.com/file/d/` links
- **Sync Process**: `syncMessages.js:117-143` links Drive files to emails
- **Database**: PostgreSQL with Prisma ORM

### Current Limitations
- Only detects `drive.google.com/file/d/{fileId}` patterns
- Missing Google Workspace document types (Docs, Sheets, Slides, Forms)
- No differentiation between file types in UI

## Implementation Plan

### Phase 1: Database Schema Updates

#### 1.1 File Model Enhancement
Add new fields to `File` model in `prisma/schema.prisma`:

```prisma
model File {
  // ... existing fields
  file_type      String?  @default("drive") // 'drive', 'docs', 'sheets', 'slides', 'forms'
  docs_url       String?  // Original Google Docs URL
  is_shared      Boolean? @default(false)
  
  // Update indexes
  @@index([file_type])
  @@index([file_type, user_id])
}
```

#### 1.2 Migration
- Create Prisma migration for schema changes
- Update existing records to set `file_type = 'drive'`
- Add validation for file_type enum values

### Phase 2: URL Pattern Detection

#### 2.1 Google Docs URL Patterns
Extend detection to support:
- `https://docs.google.com/document/d/{fileId}/`
- `https://docs.google.com/spreadsheets/d/{fileId}/`
- `https://docs.google.com/presentation/d/{fileId}/`
- `https://docs.google.com/forms/d/{fileId}/`

#### 2.2 Enhanced Regex Patterns
```javascript
const GOOGLE_FILE_PATTERNS = {
  drive: /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g,
  docs: /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/g,
  sheets: /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/g,
  slides: /https:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/g,
  forms: /https:\/\/docs\.google\.com\/forms\/d\/([a-zA-Z0-9_-]+)/g
};
```

### Phase 3: Service Layer Updates

#### 3.1 GoogleOAuthService Enhancement
Update `GoogleOAuthService.getGmailMessages()`:

```javascript
// Extract all Google file types from email body
function extractGoogleFiles(bodyText) {
  const files = [];
  
  Object.entries(GOOGLE_FILE_PATTERNS).forEach(([type, pattern]) => {
    const matches = bodyText.matchAll(pattern);
    for (const match of matches) {
      files.push({
        type,
        fileId: match[1],
        url: match[0]
      });
    }
  });
  
  return files;
}
```

#### 3.2 Metadata Extraction
- Use existing Google Drive API for all file types
- Handle permissions and access control
- Extract file metadata (title, modified date, sharing settings)

### Phase 4: Sync Process Updates

#### 4.1 syncMessages.js Enhancement
Update attachment processing:

```javascript
// Process all Google file attachments
if (message.attachments && message.attachments.length > 0) {
  for (const attachment of message.attachments) {
    if (['drive', 'docs', 'sheets', 'slides', 'forms'].includes(attachment.type)) {
      // Fetch file metadata from Google Drive API
      const fileMetadata = await fetchGoogleFileMetadata(attachment.fileId, tokens);
      
      // Create/update File record with type information
      const file = await tx.file.upsert({
        where: { google_id: attachment.fileId },
        update: {
          name: fileMetadata.name,
          mime_type: fileMetadata.mimeType,
          file_type: attachment.type,
          docs_url: attachment.url,
          modified_at: new Date(fileMetadata.modifiedTime)
        },
        create: {
          google_id: attachment.fileId,
          name: fileMetadata.name,
          mime_type: fileMetadata.mimeType,
          file_type: attachment.type,
          docs_url: attachment.url,
          web_view_link: fileMetadata.webViewLink,
          owners: fileMetadata.owners,
          modified_at: new Date(fileMetadata.modifiedTime),
          user_id: userId
        }
      });
      
      // Link to email
      await tx.emailFileLink.upsert({
        where: {
          email_id_file_id: {
            email_id: savedMessage.id,
            file_id: file.id
          }
        },
        update: {},
        create: {
          email_id: savedMessage.id,
          file_id: file.id
        }
      });
    }
  }
}
```

### Phase 5: Frontend Updates

#### 5.1 File Type Icons
Add file type specific icons in email view:
- 📄 Google Docs
- 📊 Google Sheets  
- 📽️ Google Slides
- 📋 Google Forms
- 📁 Google Drive (existing)

#### 5.2 UI Components
Update `gmail-view.jsx`:
- Display file type badges
- Show appropriate icons for each file type
- Maintain existing functionality for Drive files

#### 5.3 File Type Filtering
Add filtering options by file type in email view

### Phase 6: Testing & Validation

#### 6.1 Unit Tests
- Test URL pattern matching
- Test file metadata extraction
- Test database operations

#### 6.2 Integration Tests
- Test email sync with mixed file types
- Test frontend display of different file types
- Test error handling for invalid URLs

#### 6.3 Manual Testing
- Send test emails with various Google file types
- Verify sync process works correctly
- Confirm UI displays file types properly

## Implementation Timeline

### Sprint 1 (Days 1-3)
- [ ] Database schema updates and migration
- [ ] Update URL pattern detection logic
- [ ] Unit tests for pattern matching

### Sprint 2 (Days 4-6)
- [ ] Enhance GoogleOAuthService for metadata extraction
- [ ] Update syncMessages controller
- [ ] Integration tests for sync process

### Sprint 3 (Days 7-9)
- [ ] Frontend file type icon implementation
- [ ] UI updates for file type display
- [ ] Manual testing and bug fixes

### Sprint 4 (Days 10-12)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation updates

## Technical Considerations

### Security
- Maintain existing OAuth scope requirements
- Validate file IDs before API calls
- Handle permission errors gracefully

### Performance
- Batch file metadata requests where possible
- Cache file metadata to reduce API calls
- Index new file_type field for efficient queries

### Error Handling
- Handle invalid Google Docs URLs
- Manage API rate limits
- Fallback for inaccessible shared documents

## Success Criteria
- [x] System detects all Google Workspace file types in emails
- [x] File metadata is properly extracted and stored
- [x] Frontend displays appropriate icons and file type information
- [x] Existing Drive file functionality remains unchanged
- [x] Performance impact is minimal
- [x] No breaking changes to existing API

## Future Enhancements
- Support for other Google file types (Drawings, Sites, etc.)
- File content indexing for search functionality
- Real-time file change notifications
- Bulk file operations in UI