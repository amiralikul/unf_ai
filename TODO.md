# Full-Stack AI-Powered Drive/Gmail/Trello App – TODO List

## 🚀 Project Setup

### 1. Setup Monorepo
- [x] Use `pnpm` + `workspace` config
- [x] Run `pnpm init` and setup `frontend` + `backend` as packages
- [x] Add `.env`, `.env.example`, `.gitignore`

## 🔧 Backend Development

### 2. Backend Setup
- [x] Navigate to backend directory and run `pnpm init`
- [x] Install dependencies: `pnpm add express cors dotenv axios openai`
- [x] Install Prisma dependencies: `pnpm add prisma @prisma/client sqlite3`
- [x] Install additional packages: `pnpm add zod node-cron googleapis`
- [x] Setup Express entry point `src/app.js`
- [x] Setup Prisma schema with models: User, File, Email, TrelloBoard, TrelloCard

### 3. OAuth Integrations
#### Google:
- [x] Install `googleapis` package
- [x] Setup `OAuth2Client`
- [x] Implement route: `/auth/google/callback`
- [x] Store tokens in DB or session store
- [x] Create GoogleOAuthService with Drive & Gmail integration
- [x] Add authentication middleware and protected routes
- [x] Create frontend auth hooks and UI

#### Trello:
- [ ] Use token-based API key approach
- [ ] Create modal for user to paste key/token (skip OAuth 1.0a)

### 4. API Routes
- [x] Create `GET /api/drive/files` (with Google OAuth integration)
- [ ] Create `PATCH /api/drive/files/:id`
- [ ] Create `DELETE /api/drive/files/:id`
- [x] Create `GET /api/gmail/messages` (with Google OAuth integration)
- [ ] Create `GET /api/trello/boards`
- [ ] Create `POST /api/ai/query`
- [ ] Add Zod validation for query/input payloads
- [x] Add authentication middleware to protect routes

### 5. Background Sync Jobs
- [ ] Setup `node-cron`
- [ ] Create `jobs/driveSync.ts`
- [ ] Create `jobs/gmailSync.ts`
- [ ] Create `jobs/trelloSync.ts`
- [ ] Schedule full sync every X minutes

### 6. AI Integration
- [ ] Use OpenAI SDK
- [ ] Create service `askAI(question: string)`
- [ ] Setup prompt format for AI responses
- [ ] Implement data filtering for AI context

## 💻 Frontend Development

### 7. Frontend Setup
- [x] Navigate to frontend directory
- [x] Run `pnpm create vite . -- --template react`
- [x] Install dependencies: `pnpm add @tanstack/react-query axios tailwindcss`
- [x] Install additional packages: `pnpm add clsx zod react-router-dom`

### 8. Tailwind + ShadCN Setup
- [x] Initialize tailwind: `pnpm add @tailwindcss/vite` (v4+ method)
- [x] Configure Vite plugin and CSS import
- [ ] Install `shadcn/ui`
- [ ] Create layout shell: left-nav + main-content

### 9. API Integration with Axios + Tanstack Query
- [x] Setup axios client in `lib/api.js`
- [x] Create hook: `useDriveFiles`
- [x] Create hook: `useGmailMessages`
- [x] Create hook: `useTrelloBoards`
- [x] Wrap each hook with `useQuery`

### 10. Pages
- [ ] Create Drive Page: File list, date filter, actions (edit/delete)
- [ ] Create Gmail Page: Table of emails
- [ ] Create Trello Page: Kanban or list view
- [ ] Create AI Page: `useChat` from Vercel AI SDK

### 11. Modals and Forms
- [ ] Use ShadCN `Dialog` for edit/delete modals
- [ ] Create controlled forms with Zod validation
- [ ] Implement form submission handlers

### 12. Chat Interface
- [ ] Add bottom-right button that opens AI panel
- [ ] Create text input → POST to `/api/ai/query`
- [ ] Stream response back using Vercel AI SDK
- [ ] Handle chat history and state

## 🧪 Testing & Quality

### 13. Testing Plan
- [ ] Setup Jest + Supertest for backend
- [ ] Setup Vitest + React Testing Library for frontend
- [ ] Add smoke test for each API route
- [ ] Add component tests for major UI components

## 🚢 Deployment

### 14. Deployment Plan
- [ ] Create Docker + Compose setup
- [ ] Configure `.env` for secrets
- [ ] Choose deployment platform (Railway / Fly.io / Render)
- [ ] Deploy and test production environment

## 📚 Documentation

### 15. README Checklist
- [ ] Write project purpose and description
- [ ] List all features
- [ ] Add setup steps (backend + frontend)
- [ ] Document `.env` config instructions
- [ ] Provide example AI queries
- [ ] Add screenshots of UI
- [ ] Document design decisions + tradeoffs
- [ ] List future improvements

## 🎯 Additional Tasks
- [ ] Mock API responses for early UI development
- [ ] Log AI input/output to debug hallucinations
- [ ] Keep README and `.env.example` updated throughout development
- [ ] Test all integrations thoroughly before deployment

---

**Status:** 🟡 In Progress  
**Last Updated:** $(date)

> Build smart, not big. ✨ 