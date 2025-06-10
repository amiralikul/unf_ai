# UnFrame AI

AI-powered workspace that unifies Google Drive, Gmail, and Trello with advanced natural language to SQL capabilities. Built with React, Node.js, and PostgreSQL.

## Features

- **Google Integration**: Sync and manage Drive files and Gmail messages
- **Trello Integration**: Connect boards and cards with your Google data
- **AI-Powered Queries**: Natural language to SQL using LangChain and OpenAI
- **Smart Linking**: Automatically detect and create links between emails, files, and Trello cards
- **Session-Based Auth**: Secure OAuth flow with Google accounts
- **Real-time Sync**: Background synchronization with external APIs

## Architecture

- **Frontend**: React 19 + Vite 6 + shadcn/ui + TanStack Query
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL (Supabase recommended)
- **AI**: OpenAI GPT-4 + LangChain for NL-to-SQL
- **Authentication**: Google OAuth 2.0 with session-based auth

### Natural Language to SQL Flow

![Natural Language to SQL Flow](nl_to_sql_flow.png)

## Prerequisites

- Node.js 18+
- pnpm 10.9.0+
- PostgreSQL database (Supabase recommended)
- Google Cloud Console project
- OpenAI API account

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd unframe_ai
pnpm install
```

### 2. Database Setup

#### Option A: Supabase (Recommended)
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection string
3. Copy the URI format connection string
4. The database includes pgvector for future AI features

#### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database and user
3. Update the connection string accordingly

### 3. Environment Configuration

#### Backend Environment (.env)
Create `backend/.env`:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:5432/postgres"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/auth/google/callback"

# OpenAI API Configuration
OPENAI_API_KEY="your_openai_api_key_here"


# Application Configuration
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"
SESSION_SECRET="your_long_random_session_secret_here"
```

#### Frontend Environment (Optional)
Create `frontend/.env`:

```env
VITE_API_URL="http://localhost:3001"
```

### 4. Database Migration

```bash
# Generate Prisma client
pnpm --filter=./backend prisma:generate

# Run database migrations
pnpm --filter=./backend prisma migrate dev

# Optional: Open database GUI
pnpm --filter=./backend prisma:studio
```

## API Key Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the following APIs:
   - Google Drive API
   - Gmail API
   - Google Docs API
   - Google Identity API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
5. Copy Client ID and Client Secret to your `.env` file

**Required OAuth Scopes:**
- `https://www.googleapis.com/auth/drive` - Full Drive access
- `https://www.googleapis.com/auth/gmail.modify` - Gmail read/write/delete
- `https://www.googleapis.com/auth/documents.readonly` - Google Docs read
- `https://www.googleapis.com/auth/spreadsheets.readonly` - Google Sheets read
- `https://www.googleapis.com/auth/presentations.readonly` - Google Slides read
- `openid email profile` - User identity

### OpenAI API Setup

1. Create an account at [OpenAI Platform](https://platform.openai.com)
2. Generate an API key
3. Add billing information (required for GPT-4 access)
4. Copy the API key to your `.env` file

**Usage:**
- **Primary Model**: GPT-4 for SQL generation
- **Secondary Model**: GPT-4o-mini for response formatting
- **Features**: Natural language to SQL queries with LangChain

### Trello API Setup (Optional)

Users can configure their own Trello credentials in the app, or you can set global defaults:

1. Go to [Trello Developer Portal](https://developer.atlassian.com/cloud/trello/)
2. Create an app and get your API key
3. Generate a token with read permissions
4. Add to `.env` file (optional - users can override)

## Running the Application

### Development Mode

```bash
# Start both frontend and backend
pnpm dev

# Or start individually:
pnpm --filter=./backend dev    # Backend: http://localhost:3001
pnpm --filter=./frontend dev   # Frontend: http://localhost:5173
```

### Production Build

```bash
# Build both applications
pnpm build

# Or build individually:
pnpm --filter=./backend build
pnpm --filter=./frontend build
```

## Testing

```bash
# Run all tests
pnpm test

# Backend tests only
pnpm --filter=./backend test

# Frontend tests (placeholder)
pnpm --filter=./frontend test
```

### Backend Testing Notes

Jest runs with ES modules support using `NODE_OPTIONS='--experimental-vm-modules'`. Test files are located in `__tests__/` directories within feature folders.

## API Endpoints

### Authentication
- `GET /auth/google` - Start OAuth flow
- `GET /auth/google/callback` - OAuth callback
- `POST /auth/logout` - Logout user
- `GET /auth/status` - Check auth status
- `POST /auth/trello` - Set Trello credentials

### Gmail
- `GET /api/gmail/messages` - List messages with pagination
- `GET /api/gmail/messages/:id` - Get specific message
- `POST /api/gmail/sync` - Sync messages from Gmail API
- `PUT /api/gmail/messages/:id` - Update message
- `DELETE /api/gmail/messages/:id` - Delete message

### Google Drive
- `GET /api/drive/files` - List files with pagination
- `GET /api/drive/files/:id` - Get specific file
- `POST /api/drive/sync` - Sync files from Drive API
- `PUT /api/drive/files/:id` - Update file
- `DELETE /api/drive/files/:id` - Delete file

### Trello
- `GET /api/trello/boards` - List user's boards
- `GET /api/trello/boards/:boardId/cards` - List cards in board
- `POST /api/trello/sync` - Sync boards and cards
- `PUT /api/trello/cards/:id` - Update card
- `DELETE /api/trello/cards/:id` - Delete card

### AI & Links
- `POST /api/ai/nl-to-sql` - Natural language to SQL query
- `GET /api/ai/health` - AI service health check
- `POST /api/links/card-file` - Link Trello card to file
- `DELETE /api/links/card-file/:cardId/:fileId` - Remove link

### System
- `GET /health` - Application health check
- `GET /debug/sessions` - Debug session info (dev only)

## Database Schema

### Core Models
- **User**: OAuth user with Google and Trello tokens
- **File**: Google Drive file metadata
- **Email**: Gmail message metadata
- **TrelloBoard**: Trello board data
- **TrelloCard**: Trello card data
- **Session**: User authentication sessions

### Linking Models
- **EmailFileLink**: Links between emails and files
- **TrelloCardFileLink**: Links between Trello cards and files
- **TrelloCardEmailLink**: Links between Trello cards and emails

All data is user-scoped with `userId` foreign keys and cascade delete for data isolation.

## Key Features

### Smart Link Detection
Automatically detects and creates links between:
- Gmail messages and Drive files (shared links in emails)
- Trello cards and Drive files (file URLs in card descriptions)
- Trello cards and Gmail messages (email addresses in cards)

### Natural Language Queries
Using LangChain and OpenAI GPT-4:
- Convert natural language to SQL queries
- Query across all your data (emails, files, Trello cards)
- Get structured responses with metadata

### Background Synchronization
- Periodic sync with Google Drive, Gmail, and Trello APIs
- Incremental updates to avoid API rate limits
- Maintains local database for fast queries

## Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Test database connection
pnpm --filter=./backend prisma:studio
```

**OAuth Redirect Mismatch**
- Ensure `GOOGLE_REDIRECT_URI` matches Google Console settings
- Check that frontend URL is correct in backend `.env`

**API Rate Limits**
- Google APIs have daily quotas
- OpenAI has usage-based billing
- Trello has rate limits per API key

**Session Issues**
```bash
# Check debug endpoint (development only)
curl http://localhost:3001/debug/sessions
```

### Development Tips

**Database Changes**
```bash
# After modifying schema.prisma
pnpm --filter=./backend prisma:generate
pnpm --filter=./backend prisma migrate dev
```

**Service Restart**
```bash
# Restart backend only
pnpm --filter=./backend dev
```

**Clear Browser Data**
- Clear cookies if experiencing authentication issues
- Check browser console for CORS errors

## Contributing

1. Follow the functional controller pattern with dependency injection
2. Use Prisma for all database operations
3. Implement proper error handling with custom error classes
4. Add tests for new features
5. Update API documentation for new endpoints

## License

[Add your license information here]

## Support

For issues and questions:
- Check the troubleshooting section above
- Review error logs in the console
- Ensure all environment variables are set correctly
- Verify API keys have proper permissions