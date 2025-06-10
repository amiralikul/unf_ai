# UnFrame AI Application Flow

This document contains Mermaid diagrams illustrating the key application flows and architecture.

## 1. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant G as Google OAuth
    participant D as Database
    participant S as SessionService

    U->>F: Click "Login with Google"
    F->>B: GET /auth/google
    B->>G: Generate OAuth URL
    G-->>B: Return auth URL
    B-->>F: Return auth URL
    F->>G: Redirect to Google OAuth
    
    U->>G: Enter credentials & consent
    G->>B: Redirect to /auth/google/callback?code=xxx
    B->>G: Exchange code for tokens
    G-->>B: Return access & refresh tokens
    
    B->>G: Get user info with tokens
    G-->>B: Return user profile
    
    B->>D: Find or create user
    D-->>B: User record
    B->>D: Update user tokens
    
    B->>S: Create session
    S->>D: Store session
    S-->>B: Session ID
    
    B->>F: Set httpOnly cookie + redirect
    F->>F: Redirect to dashboard
    
    Note over F,B: Subsequent requests include session cookie
    F->>B: API requests with session cookie
    B->>S: Validate session
    S->>D: Check session validity
    S-->>B: Session data (userId, email)
    B-->>F: Authenticated response
```

## 2. Data Synchronization Flow

```mermaid
flowchart TD
    A[User Clicks Sync] --> B{Authentication Valid?}
    B -->|No| C[Return 401 Unauthorized]
    B -->|Yes| D[Get User Tokens from DB]
    
    D --> E[Initialize Google OAuth Client]
    E --> F[Fetch Data from Google APIs]
    
    F --> G[Gmail API]
    F --> H[Drive API]
    
    G --> I[Process Gmail Messages]
    H --> J[Process Drive Files]
    
    I --> K[Extract Email Metadata]
    J --> L[Extract File Metadata]
    
    K --> M[Link Detection Service]
    L --> M
    
    M --> N{Links Found?}
    N -->|Yes| O[Create Link Records]
    N -->|No| P[Continue Processing]
    O --> P
    
    P --> Q[Batch Upsert to Database]
    Q --> R[Update Last Sync Time]
    R --> S[Return Success Response]
    
    subgraph "Background Process"
        T[Scheduled Sync Job]
        T --> U[Get All Active Users]
        U --> V[For Each User]
        V --> W[Check Token Validity]
        W --> X[Refresh if Needed]
        X --> Y[Trigger Sync Process]
        Y --> Z[Log Sync Results]
    end
```

## 3. AI Query Processing Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant L as LangChain Service
    participant O as OpenAI API
    participant D as Database
    participant P as Prisma

    U->>F: Enter natural language query
    F->>B: POST /api/ai/nl-to-sql
    B->>B: Validate user session
    B->>B: Validate query input
    
    B->>L: nlToSqlQuery(question, userId)
    L->>L: Initialize LangChain SQL agent
    L->>D: Get database schema
    D-->>L: Schema information
    
    L->>O: Generate SQL from natural language
    Note over L,O: Uses GPT-4 with schema context
    O-->>L: Generated SQL query
    
    L->>L: Validate SQL query
    L->>L: Add user_id filter for security
    
    L->>P: Execute SQL query
    P->>D: Run query with user scope
    D-->>P: Query results
    P-->>L: Formatted results
    
    L->>O: Generate human-readable response
    Note over L,O: Uses GPT-4o-mini for formatting
    O-->>L: Natural language response
    
    L-->>B: Complete query result
    B->>D: Log query for analytics
    B-->>F: Return response
    F->>F: Display results to user
    
    Note over U,D: All queries are user-scoped for security
```

## 4. Overall Application Architecture

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        UI[React Components]
        RQ[TanStack Query]
        RR[React Router]
        SC[shadcn/ui Components]
    end
    
    subgraph "Backend (Node.js + Express)"
        API[Express Routes]
        CTRL[Functional Controllers]
        MW[Middleware]
        SERV[Services Layer]
    end
    
    subgraph "External APIs"
        GOOGLE[Google APIs]
        OPENAI[OpenAI API]
        TRELLO[Trello API]
    end
    
    subgraph "Database Layer"
        PRISMA[Prisma ORM]
        PG[(PostgreSQL/Supabase)]
    end
    
    subgraph "Authentication"
        OAUTH[Google OAuth]
        SESS[Session Store]
    end
    
    UI --> RQ
    RQ --> API
    RR --> UI
    SC --> UI
    
    API --> MW
    MW --> CTRL
    CTRL --> SERV
    
    SERV --> GOOGLE
    SERV --> OPENAI
    SERV --> TRELLO
    SERV --> PRISMA
    SERV --> OAUTH
    
    PRISMA --> PG
    OAUTH --> SESS
    SESS --> PG
    
    GOOGLE -.->|OAuth Flow| OAUTH
    
    classDef frontend fill:#e1f5fe
    classDef backend fill:#f3e5f5
    classDef external fill:#fff3e0
    classDef database fill:#e8f5e8
    classDef auth fill:#fce4ec
    
    class UI,RQ,RR,SC frontend
    class API,CTRL,MW,SERV backend
    class GOOGLE,OPENAI,TRELLO external
    class PRISMA,PG database
    class OAUTH,SESS auth
```

## 5. Link Detection Flow

```mermaid
flowchart TD
    A[Sync Process Starts] --> B[Process Gmail Messages]
    B --> C[Process Drive Files]
    C --> D[Process Trello Cards]
    
    D --> E[LinkDetectionService.detectLinks]
    
    E --> F{Email Contains Drive Links?}
    F -->|Yes| G[Create EmailFileLink]
    F -->|No| H[Continue Processing]
    
    G --> I{Trello Card Has File URLs?}
    H --> I
    I -->|Yes| J[Create TrelloCardFileLink]
    I -->|No| K[Continue Processing]
    
    J --> L{Trello Card Has Email Addresses?}
    K --> L
    L -->|Yes| M[Create TrelloCardEmailLink]
    L -->|No| N[Complete Link Detection]
    
    M --> N
    N --> O[Batch Insert Links to Database]
    O --> P[Return Link Statistics]
    
    subgraph "Link Detection Logic"
        Q[Extract URLs from Email Body]
        R[Match URLs to Drive Files]
        S[Extract URLs from Trello Descriptions]
        T[Match URLs to Files]
        U[Extract Email Addresses from Cards]
        V[Match to Gmail Messages]
    end
```

## 6. Dependency Injection Flow

```mermaid
graph TD
    A[Application Startup] --> B[controllers/index.js]
    
    B --> C[Initialize Core Dependencies]
    C --> D[new PrismaClient()]
    C --> E[new OpenAI()]
    C --> F[new GoogleOAuthService()]
    C --> G[new TrelloService()]
    
    B --> H[Initialize Service Layer]
    H --> I[new SessionService(prisma)]
    H --> J[new LinkDetectionService(prisma)]
    H --> K[new LangChainSqlService(openai, prisma)]
    
    B --> L[Create Controller Factories]
    L --> M[createAIControllers({openai, prisma, langchainService})]
    L --> N[createGmailControllers({googleOAuth, prisma, linkDetectionService})]
    L --> O[createDriveControllers({googleOAuth, prisma, linkDetectionService})]
    L --> P[createTrelloControllers({trelloService, prisma})]
    
    M --> Q[Export Centralized Controllers]
    N --> Q
    O --> Q
    P --> Q
    
    Q --> R[Route Files Import Controllers]
    R --> S[No Direct Service Instantiation]
    
    classDef dependency fill:#e3f2fd
    classDef service fill:#f1f8e9
    classDef controller fill:#fff8e1
    classDef route fill:#fce4ec
    
    class D,E,F,G dependency
    class I,J,K service
    class M,N,O,P controller
    class R,S route
```

## 7. Error Handling Flow

```mermaid
flowchart TD
    A[API Request] --> B[Route Handler]
    B --> C[Authentication Middleware]
    C --> D{Session Valid?}
    D -->|No| E[AuthenticationError]
    D -->|Yes| F[Controller Function]
    
    F --> G{External API Call?}
    G -->|Yes| H[Service Layer]
    G -->|No| I[Database Operation]
    
    H --> J{API Response OK?}
    J -->|No| K[ExternalServiceError]
    J -->|Yes| L[Process Response]
    
    I --> M{Database Operation OK?}
    M -->|No| N[DatabaseError]
    M -->|Yes| O[Return Success]
    
    L --> P{Validation OK?}
    P -->|No| Q[ValidationError]
    P -->|Yes| R[Continue Processing]
    
    E --> S[Error Handler Middleware]
    K --> S
    N --> S
    Q --> S
    
    S --> T[Log Error]
    T --> U[Format Error Response]
    U --> V[Return HTTP Error]
    
    R --> W[Send Success Response]
    O --> W
    
    classDef error fill:#ffebee
    classDef success fill:#e8f5e8
    classDef process fill:#f3e5f5
    
    class E,K,N,Q,S,T,U,V error
    class O,W success
    class A,B,C,F,G,H,I,L,P,R process
```

## 8. Session Management Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Route
    participant AUTH as Auth Middleware
    participant SESS as SessionService
    participant DB as Database
    
    C->>API: Request with session cookie
    API->>AUTH: Check authentication
    AUTH->>SESS: getSession(sessionId)
    SESS->>DB: Query session table
    
    alt Session Found & Valid
        DB-->>SESS: Session data
        SESS-->>AUTH: Valid session
        AUTH->>AUTH: Set req.user
        AUTH->>API: Continue to route handler
        API-->>C: Process request normally
    else Session Not Found
        DB-->>SESS: null
        SESS-->>AUTH: null
        AUTH-->>C: 401 Unauthorized
    else Session Expired
        DB-->>SESS: Expired session
        SESS->>DB: Delete expired session
        SESS-->>AUTH: null
        AUTH-->>C: 401 Unauthorized
    end
    
    Note over SESS,DB: Cleanup job runs every 30 minutes
    SESS->>DB: DELETE expired sessions
```

## 9. User Data Flow & Security

```mermaid
flowchart TD
    A[User Request] --> B[Authentication Check]
    B --> C{Valid Session?}
    C -->|No| D[Return 401]
    C -->|Yes| E[Extract userId from session]
    
    E --> F[Controller Function]
    F --> G[Database Query]
    G --> H[Add WHERE userId = ?]
    
    H --> I[Prisma Query Execution]
    I --> J[PostgreSQL Query]
    J --> K[Return User-Scoped Data Only]
    
    K --> L[Response Formatting]
    L --> M[Return to Client]
    
    subgraph "Data Isolation"
        N[All Models Have userId]
        O[Cascade Delete on User]
        P[Query Filters by userId]
        Q[No Cross-User Data Access]
    end
    
    subgraph "Security Layers"
        R[Session Validation]
        S[User Scope Filtering]
        T[SQL Injection Prevention]
        U[CORS Protection]
    end
    
    classDef security fill:#ffebee
    classDef data fill:#e8f5e8
    classDef process fill:#e3f2fd
    
    class B,C,D,R,S,T,U security
    class N,O,P,Q,K data
    class A,E,F,G,H,I,J,L,M process
```

## 10. Monorepo Development Flow

```mermaid
graph LR
    A[Developer] --> B[pnpm dev]
    
    B --> C[Concurrently Start]
    C --> D[Backend: pnpm --filter=./backend dev]
    C --> E[Frontend: pnpm --filter=./frontend dev]
    
    D --> F[Express Server :3001]
    E --> G[Vite Dev Server :5173]
    
    F --> H[Watch src/ changes]
    G --> I[Hot Module Replacement]
    
    H --> J[Nodemon Restart]
    I --> K[Instant UI Updates]
    
    subgraph "Development Tools"
        L[Prisma Studio]
        M[ESLint]
        N[TypeScript]
        O[Jest Testing]
    end
    
    subgraph "Production Build"
        P[pnpm build]
        P --> Q[Backend Build]
        P --> R[Frontend Build]
        Q --> S[Optimize Node.js]
        R --> T[Vite Bundle]
    end
    
    classDef dev fill:#e8f5e8
    classDef prod fill:#fff3e0
    classDef tools fill:#f3e5f5
    
    class A,B,C,D,E,F,G,H,I,J,K dev
    class P,Q,R,S,T prod
    class L,M,N,O tools
```

These diagrams provide a comprehensive view of the UnFrame AI application architecture, showing how different components interact, data flows through the system, and how security and user isolation is maintained throughout the application.