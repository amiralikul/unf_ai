# CRUD Operations Implementation Plan

## Overview

This plan outlines the implementation of basic CRUD operations (Create, Read, Update, Delete) for Drive files, Gmail messages, and Trello cards/boards with user-friendly UI interactions including edit and delete dialogs.

## Current State Analysis

### Data Models (From Prisma Schema)

**Drive Files (`File` model)**
- Core fields: `id`, `google_id`, `name`, `mime_type`, `size`, `web_view_link`
- Editable fields: `name`, `file_type`
- Metadata: `modified_at`, `created_at`, `user_id`
- Relations: Links to emails and Trello cards

**Gmail Messages (`Email` model)**
- Core fields: `id`, `google_id`, `subject`, `sender_email`, `recipient_email`
- Editable fields: `is_read`, `is_important`
- Metadata: `received_at`, `created_at`, `user_id`
- Relations: Attachments and Trello card links

**Trello Cards (`TrelloCard` model)**
- Core fields: `id`, `trello_id`, `name`, `description`, `url`
- Editable fields: `name`, `description`, `status`, `priority`, `due_date`
- Metadata: `created_at`, `updated_at`, `user_id`, `board_id`

### Existing Backend API Support

**Drive (`/api/drive/`)**
- ✅ GET `/files` - List files (implemented)
- ✅ GET `/files/:fileId` - Get file by ID (implemented)
- ✅ POST `/sync` - Sync from Google Drive (implemented)
- ❌ PUT/PATCH `/files/:fileId` - Update file (missing backend)
- ❌ DELETE `/files/:fileId` - Delete file (commented out)

**Gmail (`/api/gmail/`)**
- ✅ GET `/messages` - List messages (implemented)
- ✅ GET `/messages/:messageId` - Get message by ID (implemented)
- ✅ POST `/sync` - Sync from Gmail (implemented)
- ❌ PUT/PATCH `/messages/:messageId` - Update message (missing backend)
- ❌ DELETE `/messages/:messageId` - Delete message (commented out)

**Trello (`/api/trello/`)**
- ✅ GET `/boards` - List boards (implemented)
- ✅ GET `/boards/:boardId/cards` - Get board cards (implemented)
- ✅ POST `/sync` - Sync from Trello (implemented)
- ❌ GET `/boards/:boardId` - Get board by ID (commented out)
- ❌ PUT/PATCH `/cards/:cardId` - Update card (missing)
- ❌ DELETE `/cards/:cardId` - Delete card (missing)

### Existing Frontend Hooks

**Drive Hooks (`useDriveFiles.js`)**
- ✅ `useDriveFiles()` - Query files list
- ✅ `useDriveFile(id)` - Query single file
- ✅ `useUpdateDriveFile()` - Mutation for updates (ready but no backend)
- ✅ `useDeleteDriveFile()` - Mutation for deletes (ready but no backend)
- ✅ `useSyncDriveFiles()` - Sync mutation

**Gmail Hooks (`useGmailMessages.js`)**
- ✅ `useGmailMessages()` - Query messages list
- ✅ `useGmailMessage(id)` - Query single message
- ✅ `useDeleteGmailMessage()` - Mutation for deletes (ready but no backend)
- ✅ `useSyncGmailMessages()` - Sync mutation
- ❌ Missing: Update message mutation

**Trello Hooks (`useTrelloBoards.js`)**
- ✅ `useTrelloBoards()` - Query boards list
- ✅ `useTrelloBoard(boardId)` - Query single board
- ✅ `useSyncTrelloData()` - Sync mutation
- ❌ Missing: Card CRUD mutations

## Implementation Plan

### Phase 1: UI Components Foundation

#### 1.1 Create Dialog Components

**File**: `src/components/ui/dialog.jsx`
```jsx
// Implement shadcn/ui Dialog component
// - DialogRoot, DialogTrigger, DialogContent
// - DialogHeader, DialogTitle, DialogDescription
// - DialogFooter with action buttons
```

**File**: `src/components/ui/confirm-dialog.jsx`
```jsx
// Reusable confirmation dialog for delete operations
// Props: title, description, onConfirm, onCancel, destructive
// Use AlertTriangle icon for warning
```

#### 1.2 Create Item Detail Dialogs

**File**: `src/components/dialogs/EditFileDialog.jsx`
```jsx
// Edit drive file dialog
// Fields: name, file_type (select)
// Form validation with error handling
```

**File**: `src/components/dialogs/EditEmailDialog.jsx`
```jsx
// Edit email message dialog
// Fields: is_read (toggle), is_important (toggle)
// Display read-only: subject, sender, received_at
```

**File**: `src/components/dialogs/EditTrelloCardDialog.jsx`
```jsx
// Edit Trello card dialog
// Fields: name, description (textarea), status (select), priority (select), due_date
// Rich form with date picker
```

#### 1.3 Create View Detail Dialogs

**File**: `src/components/dialogs/ViewFileDialog.jsx`
```jsx
// View drive file details
// Display: all metadata, preview if possible, links
// Actions: Edit, Delete, Open in Google Drive
```

**File**: `src/components/dialogs/ViewEmailDialog.jsx` (Updated)
```jsx
// View email message details
// Display: email metadata, attachments (Preview section removed for cleaner UI)
// Shows: From, To, Date, Message ID, Google Drive Links
// Actions: Edit, Delete, Reply (future)
// Note: Message snippet preview removed to focus on actionable content
```

**File**: `src/components/dialogs/ViewTrelloCardDialog.jsx`
```jsx
// View Trello card details
// Display: description, checklist, due date, activity
// Actions: Edit, Delete, Open in Trello
```

### Phase 2: Backend API Implementation

#### 2.1 Drive File Operations

**File**: `backend/src/controllers/drive/updateFile.js`
```javascript
// Update file metadata in database
// Validate user ownership
// Fields: name, file_type
// Return updated file object
```

**File**: `backend/src/controllers/drive/deleteFile.js`
```javascript
// Soft delete or remove from database
// Validate user ownership
// Clean up related links (emails, trello cards)
// Option to delete from Google Drive too
```

#### 2.2 Gmail Message Operations

**File**: `backend/src/controllers/gmail/updateMessage.js`
```javascript
// Update message metadata
// Fields: is_read, is_important
// Sync back to Gmail API if needed
// Return updated message object
```

**File**: `backend/src/controllers/gmail/deleteMessage.js`
```javascript
// Remove message from database
// Validate user ownership
// Clean up related links
// Option to delete from Gmail too
```

#### 2.3 Trello Card Operations

**File**: `backend/src/controllers/trello/updateCard.js`
```javascript
// Update card via Trello API and database
// Fields: name, description, status, priority, due_date
// Sync with Trello API
// Return updated card object
```

**File**: `backend/src/controllers/trello/deleteCard.js`
```javascript
// Remove card from database
// Validate user ownership
// Option to archive in Trello
// Clean up related links
```

#### 2.4 API Routes Updates

**Files**: 
- `backend/src/api/drive.js` - Uncomment and implement update/delete routes
- `backend/src/api/gmail.js` - Uncomment and implement update/delete routes
- `backend/src/api/trello.js` - Add new card update/delete routes

### Phase 3: Frontend Hook Enhancements

#### 3.1 Missing Hooks Implementation

**File**: `src/hooks/useGmailMessages.js`
```javascript
// Add useUpdateGmailMessage() hook
// Mutation for updating message metadata
// Invalidate relevant queries on success
```

**File**: `src/hooks/useTrelloCards.js` (New file)
```javascript
// Create comprehensive Trello card hooks
// useTrelloCards(boardId) - Query cards for board
// useTrelloCard(cardId) - Query single card
// useUpdateTrelloCard() - Update card mutation
// useDeleteTrelloCard() - Delete card mutation
```

#### 3.2 API Client Updates

**File**: `src/lib/api.js`
```javascript
// Add missing API methods:
// updateDriveFile(id, data) - PATCH /api/drive/files/:id
// updateGmailMessage(id, data) - PATCH /api/gmail/messages/:id
// getTrelloCard(cardId) - GET /api/trello/cards/:id
// updateTrelloCard(id, data) - PATCH /api/trello/cards/:id
// deleteTrelloCard(id) - DELETE /api/trello/cards/:id
```

### Phase 4: View Component Integration

#### 4.1 Drive View Enhancements

**File**: `src/components/views/drive-view.jsx`

**Changes needed:**
1. Add Edit and Delete icons to action dropdown
2. Integrate with edit/delete dialogs
3. Add view details on row click
4. Update handleFileAction method

```jsx
// Action dropdown updates
<DropdownMenuItem onClick={() => handleFileAction('view', file)}>
  <Eye className="mr-2 h-4 w-4" />
  View Details
</DropdownMenuItem>
<DropdownMenuItem onClick={() => handleFileAction('edit', file)}>
  <Edit className="mr-2 h-4 w-4" />
  Edit
</DropdownMenuItem>
<DropdownMenuItem 
  onClick={() => handleFileAction('delete', file)}
  className="text-destructive"
>
  <Trash2 className="mr-2 h-4 w-4" />
  Delete
</DropdownMenuItem>
```

#### 4.2 Gmail View Enhancements ✅ COMPLETED

**File**: `src/components/views/gmail-view.jsx`

**Changes completed:**
1. ✅ Added action dropdown menus with three-dot icons
2. ✅ Implemented view/edit/delete actions via dropdown
3. ✅ Replaced row click with explicit dropdown actions
4. ✅ Added actions column to desktop table view
5. ✅ Added dropdown menus to mobile card view
6. ✅ Removed Archive and Trash toolbar icons for cleaner interface
7. ✅ Maintained consistent pattern with Drive view

```jsx
// ✅ IMPLEMENTED: Action column in table
<TableHead className="w-[50px]"></TableHead>

// ✅ IMPLEMENTED: Action dropdown in each row
<TableCell>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Actions</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => handleMessageAction('view', email)}>
        <Eye className="mr-2 h-4 w-4" />
        View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleMessageAction('edit', email)}>
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={() => handleMessageAction('delete', email)}
        className="text-destructive focus:text-destructive"
      >
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
```

#### 4.3 Trello View Enhancements ✅ COMPLETED

**File**: `src/components/views/trello-view.jsx`

**Changes completed:**
1. ✅ Added action dropdown menus with three-dot icons
2. ✅ Implemented view/edit/delete actions via dropdown
3. ✅ Replaced row click with explicit dropdown actions
4. ✅ Added actions column to desktop table view
5. ✅ Added dropdown menus to mobile card view
6. ✅ Created ViewTrelloCardDialog and EditTrelloCardDialog components
7. ✅ Integrated with useUpdateTrelloCard and useDeleteTrelloCard hooks
8. ✅ Added comprehensive form validation and error handling
9. ✅ Implemented transaction-safe deletion with related record cleanup

```jsx
// ✅ IMPLEMENTED: Action column in table
<TableHead className="w-[50px]"></TableHead>

// ✅ IMPLEMENTED: Action dropdown in each row
<TableCell>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Actions</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => handleCardAction('view', card)}>
        <Eye className="mr-2 h-4 w-4" />
        View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleCardAction('edit', card)}>
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={() => handleCardAction('delete', card)}
        className="text-destructive focus:text-destructive"
      >
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
```

### Phase 5: Advanced Features

#### 5.1 Batch Operations
- Select multiple items for bulk delete
- Bulk status updates for emails/cards

#### 5.2 Confirmation and Feedback
- Toast notifications for success/error
- Undo functionality for deletes
- Loading states during operations

#### 5.3 Validation and Error Handling
- Form validation for edit dialogs
- Network error handling
- Optimistic updates with rollback

## Implementation Steps

### Step 1: Create UI Foundation
- [ ] Implement `Dialog` component using shadcn/ui pattern
- [ ] Create `ConfirmDialog` component for delete confirmations
- [ ] Create form components for edit dialogs

### Step 2: Implement View Dialogs
- [ ] `ViewFileDialog` - Display file details with actions
- [ ] `ViewEmailDialog` - Display email content with metadata
- [ ] `ViewTrelloCardDialog` - Display card details

### Step 3: Implement Edit Dialogs
- [ ] `EditFileDialog` - Form for file name/type
- [ ] `EditEmailDialog` - Toggle for read/important status
- [ ] `EditTrelloCardDialog` - Comprehensive card editing form

### Step 4: Backend Controllers
- [ ] Drive: `updateFile.js`, `deleteFile.js`
- [ ] Gmail: `updateMessage.js`, `deleteMessage.js`
- [ ] Trello: `updateCard.js`, `deleteCard.js`

### Step 5: Backend Routes
- [ ] Uncomment and implement drive update/delete routes
- [ ] Uncomment and implement gmail update/delete routes
- [ ] Add new Trello card routes

### Step 6: Frontend API Integration
- [ ] Add missing API methods to `api.js`
- [ ] Create `useTrelloCards.js` hook file
- [ ] Add missing mutation hooks

### Step 7: View Component Integration
- [ ] Update `DriveView` with edit/delete actions
- [ ] Update `GmailView` with action dropdown
- [ ] Update/create `TrelloView` with card management

### Step 8: Testing and Polish
- [ ] Test all CRUD operations
- [ ] Add error handling and validation
- [ ] Implement loading states and feedback
- [ ] Add confirmation dialogs for destructive actions

## Technical Considerations

### Data Synchronization
- Local database changes should optionally sync back to external APIs
- Handle conflicts between local and remote data
- Implement cache invalidation strategies

### Permissions and Validation
- Ensure users can only modify their own data
- Validate all input data on both frontend and backend
- Handle API rate limits for external services

### User Experience
- Optimistic updates for better perceived performance
- Clear error messages and recovery options
- Keyboard shortcuts for power users
- Mobile-responsive dialogs

### Performance
- Lazy load dialog components
- Debounce search and filter operations
- Paginate large datasets
- Cache frequently accessed data

## Success Metrics

1. **Functionality**: All CRUD operations working for Drive, Gmail, and Trello
2. **User Experience**: Intuitive edit/delete workflows with proper confirmation
3. **Data Integrity**: No data loss or corruption during operations
4. **Performance**: Operations complete within 2 seconds
5. **Error Handling**: Graceful handling of all error scenarios

## Future Enhancements

1. **Advanced Editing**: Rich text editor for email/card descriptions
2. **Bulk Operations**: Multi-select for batch actions
3. **Real-time Updates**: WebSocket integration for live data sync
4. **Offline Support**: Queue operations when offline
5. **Audit Trail**: Track all CRUD operations for compliance
6. **Advanced Search**: Full-text search across all data types
7. **Export/Import**: CSV/JSON export functionality
8. **API Webhooks**: Real-time sync with external services

## Rollback Plan

If critical issues arise:
1. Disable edit/delete functionality via feature flags
2. Revert to read-only mode with sync operations only
3. Restore from database backups if data corruption occurs
4. Document issues and plan incremental fixes

## Security Considerations

1. **Authentication**: All operations require valid session
2. **Authorization**: Users can only access their own data
3. **Input Validation**: Sanitize all user inputs
4. **Rate Limiting**: Prevent abuse of delete operations
5. **Audit Logging**: Track all CRUD operations
6. **Data Encryption**: Ensure sensitive data is encrypted in transit and at rest