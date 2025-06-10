# Gmail Delete ID Mismatch Fix

## Problem
Gmail message deletion was returning 404 "Message not found" error even though the message existed in the database.

## Root Cause
There was a mismatch between the ID used by the frontend and the ID expected by the backend controllers:

### Frontend ID Usage
```javascript
// In getMessages.js controller
const transformedMessages = messages.map(message => ({
  ...message,
  id: message.google_id, // Frontend receives google_id as 'id'
  gmailId: message.google_id,
  // ... other fields
}));
```

### Backend Controller Problem
```javascript
// In deleteMessage.js (BEFORE FIX)
const existingMessage = await prisma.email.findUnique({
  where: {
    id: messageId  // ❌ Looking for database 'id' field
  }
});
```

### Database Schema
```prisma
model Email {
  id        String @id @default(cuid())    // Database ID (cuid)
  google_id String @unique                 // Gmail API ID
  // ... other fields
}
```

## The Mismatch
1. **Frontend sends**: Gmail API ID (`197555b05e5c35a1`) as `messageId`
2. **Backend searched for**: Database ID field (`id`) with Gmail API ID value
3. **Result**: 404 Not Found because no database record has `id = "197555b05e5c35a1"`

## Fix Applied

### Updated Delete Controller
```javascript
// BEFORE
const existingMessage = await prisma.email.findUnique({
  where: { id: messageId }  // ❌ Wrong field
});

// AFTER
const existingMessage = await prisma.email.findUnique({
  where: { google_id: messageId }  // ✅ Correct field
});
```

### Updated Update Controller
```javascript
// Similar fix applied to updateMessage.js
const existingMessage = await prisma.email.findUnique({
  where: { google_id: messageId }  // ✅ Use google_id field
});

const updatedMessage = await prisma.email.update({
  where: { id: existingMessage.id },  // ✅ Use database id for update
  data: updateData
});
```

### Enhanced Delete Cleanup
```javascript
// Also added comprehensive cleanup of related records
await tx.emailFileLink.deleteMany({
  where: { email_id: existingMessage.id }
});

await tx.trelloCardEmailLink.deleteMany({
  where: { email_id: existingMessage.id }
});
```

## Files Changed
- ✅ `backend/src/controllers/gmail/deleteMessage.js`
- ✅ `backend/src/controllers/gmail/updateMessage.js`

## Test Status
- ✅ Backend syntax validation passed
- ✅ Backend server running successfully
- ✅ Health endpoint responding
- ✅ Ready for testing Gmail delete/update functionality

## Expected Result
Gmail message deletion and updates should now work correctly:
1. Frontend sends Gmail API ID (`197555b05e5c35a1`)
2. Backend finds message using `google_id` field
3. Backend uses database `id` for actual deletion/update operations
4. All related records are properly cleaned up 