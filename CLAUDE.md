# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `pnpm dev` - Start both backend and frontend servers concurrently
- `pnpm build` - Build both applications for production
- `pnpm test` - Run tests for both backend and frontend

### Backend-specific
- `pnpm --filter=./backend dev` - Start backend only (http://localhost:3000)
- `pnpm --filter=./backend test` - Run backend Jest tests
- `pnpm --filter=./backend prisma:generate` - Generate Prisma client after schema changes
- `pnpm --filter=./backend prisma:push` - Push schema changes to PostgreSQL database
- `pnpm --filter=./backend prisma:studio` - Open Prisma Studio database GUI
- `pnpm --filter=./backend prisma migrate dev` - Create and apply new migration

### Frontend-specific
- `pnpm --filter=./frontend dev` - Start frontend only (http://localhost:5173)
- `pnpm --filter=./frontend lint` - Run ESLint checks
- `pnpm --filter=./frontend build` - Build for production

## Architecture Overview

### Monorepo Structure
This is a pnpm workspace with three packages:
- Root: Orchestrates development with concurrently
- `backend/`: Node.js Express API with Prisma + PostgreSQL
- `frontend/`: React + Vite SPA with shadcn/ui components

### Backend Architecture (Express + Prisma)
- **Controllers**: Functional controllers using dependency injection pattern in `src/controllers/`
- **Services**: External API integrations (Google OAuth, Trello) in `src/services/`
- **Database**: PostgreSQL with Prisma ORM, schema in `prisma/schema.prisma`
- **Authentication**: Session-based auth with HTTP-only cookies, no JWT
- **API Pattern**: RESTful endpoints with standardized `{success, data, meta}` responses

### Frontend Architecture (React + TanStack Query)
- **State Management**: TanStack React Query for server state, no global client state
- **Components**: shadcn/ui system in `src/components/ui/`, views in `src/components/views/`
- **Routing**: React Router DOM with protected routes
- **Styling**: Tailwind CSS with Radix UI primitives
- **Data Fetching**: Custom hooks in `src/hooks/` wrapping React Query

### Key Integration Points
- **Google APIs**: Drive (file metadata), Gmail (message metadata) with OAuth 2.0
- **Trello API**: Board and card sync with API key authentication
- **OpenAI & LangChain**: Advanced NL-to-SQL queries with LangChain integration
- **Session Management**: Database-backed sessions, 24-hour expiration

## Data Model Patterns

### User-Scoped Multi-Tenancy
All data models have `userId` foreign key with cascade delete. Users own:
- `File` - Google Drive files metadata
- `Email` - Gmail messages metadata  
- `TrelloBoard` and `TrelloCard` - Trello workspace data
- `Session` - Authentication sessions

### Synchronization Strategy
Background jobs sync external API data to local database for performance and querying capabilities.

## Controller Patterns

### Functional Controllers with DI
Controllers are factory functions that inject dependencies:
```javascript
export const createAIControllers = ({ openai, prisma }) => ({
      nlToSql: langchainNlToSqlController(openai, prisma, langchainService),
  getQueryHistory: getQueryHistoryController(prisma)
});
```

### Response Format
All API endpoints return consistent format:
```javascript
{ success: boolean, data: any, meta?: { pagination } }
```

## Authentication Flow
1. Frontend redirects to `/auth/google`
2. Backend generates OAuth URL with required scopes
3. Google callback creates/updates user and session
4. Session cookie authentication for subsequent requests
5. Protected routes check session validity

## Testing Approach
- Backend: Jest with ES modules support (`NODE_OPTIONS='--experimental-vm-modules'`)
- Frontend: No tests configured yet (placeholder script)
- Test files located in `__tests__/` directories within feature folders

## Environment Setup
- Backend uses ES modules (`"type": "module"`)
- Database URL and API keys configured via environment variables
- pnpm as package manager (version 10.9.0)