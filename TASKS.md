# Full-Stack AI-Powered Drive/Gmail/Trello App – Implementation Plan

## 🚀 Overview
This file contains a step-by-step implementation plan to build a full-stack web app that integrates Google Drive, Gmail, and Trello, with an AI-powered query interface.

---

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── api/          # Express route handlers
│   │   ├── services/     # DriveService, GmailService, TrelloService
│   │   ├── ai/           # AI integration logic
│   │   ├── jobs/         # Background sync cron jobs
│   │   ├── models/       # DB models
│   │   └── app.ts        # Express app
│   └── prisma/
├── frontend/
│   ├── src/
│   │   ├── hooks/        # useDriveFiles, useGmailMessages...
│   │   ├── pages/
│   │   ├── components/
│   │   └── lib/
│   └── index.html
└── .env
```

---

## 🧠 Step-by-Step Implementation

### 1. Setup Monorepo
- Use `pnpm` + `workspace` config
- Run `pnpm init` and setup `frontend` + `backend` as packages
- Add `.env`, `.env.example`, `.gitignore`

### 2. Backend Setup
```bash
cd backend
pnpm init -y
pnpm add express cors dotenv axios openai
pnpm add prisma @prisma/client sqlite3
pnpm add zod node-cron
```

- Setup Express entry point `src/app.ts`
- Setup Prisma schema with models: User, File, Email, TrelloBoard, TrelloCard

### 3. OAuth Integrations
#### Google:
- Use `googleapis` package
- Setup `OAuth2Client`
- Implement route: `/auth/google/callback`
- Store tokens in DB or session store

#### Trello:
- Use token-based API key approach
- Ask user to paste key/token in modal (skip OAuth 1.0a)

### 4. API Routes

- `GET /api/drive/files`
- `PATCH /api/drive/files/:id`
- `DELETE /api/drive/files/:id`
- `GET /api/gmail/messages`
- `GET /api/trello/boards`
- `POST /api/ai/query`

> Use Zod for validating query/input payloads.

### 5. Background Sync Jobs
- Setup `node-cron`
- Create `jobs/driveSync.ts`, `jobs/gmailSync.ts`, `jobs/trelloSync.ts`
- Schedule full sync every X minutes

### 6. AI Integration
- Use OpenAI SDK
- Create service `askAI(question: string)`
- Prompt format:
  ```
  You are an assistant. Answer using this data only:
  { file: ..., modifiedAt: ..., owner: ... }
  ```

---

## 💻 Frontend Setup
```bash
cd frontend
pnpm create vite . -- --template react
pnpm add @tanstack/react-query axios tailwindcss @vercel/ai
pnpm add clsx zod shadcn-ui react-router-dom
```

### 1. Tailwind + ShadCN Setup
- Init tailwind: `npx tailwindcss init`
- Install `shadcn/ui`
- Create layout shell: left-nav + main-content

### 2. API Integration with Axios + Tanstack Query
- Setup axios client in `lib/api.ts`
- Create hooks: `useDriveFiles`, `useGmailMessages`, etc.
- Each hook wraps `useQuery`

### 3. Pages
- Drive Page: File list, date filter, actions (edit/delete)
- Gmail Page: Table of emails
- Trello Page: Kanban or list view
- AI Page: `useChat` from Vercel AI SDK

### 4. Modals and Forms
- Use ShadCN `Dialog` for edit/delete
- Use controlled forms with Zod validation

### 5. Chat Interface
- Bottom-right button opens AI panel
- Text input → POST to `/api/ai/query`
- Stream response back using Vercel AI SDK

---

## ✅ Testing Plan
- Backend: Jest + Supertest
- Frontend: Vitest + React Testing Library
- Add smoke test for each API route

---

## 🚢 Deployment Plan
- Use Docker + Compose
- Use `.env` for secrets
- README with setup, run, test instructions
- Deploy with Railway / Fly.io / Render

---

## 📄 README Checklist
- Project purpose
- Feature list
- Setup steps (backend + frontend)
- `.env` config instructions
- Example AI queries
- Screenshots of UI
- Design decisions + tradeoffs
- Future improvements

---

## 🧠 Tips
- Mock API responses in early UI work
- Avoid building everything before data is available
- Log AI input/output to debug hallucinations
- Always keep README and `.env.example` updated

---

Good luck. Build smart, not big.

