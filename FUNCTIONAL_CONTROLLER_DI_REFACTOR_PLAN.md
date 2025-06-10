# Functional Controller Dependency Injection Refactor Plan

## Overview

This plan addresses the inconsistent implementation of the dependency injection (DI) pattern in the backend controllers. While some controllers follow the excellent factory pattern (e.g., `createAIControllers`, `createDriveControllers`), others violate DI principles by directly importing services and creating hidden dependencies.

## Current State Analysis

### ✅ Correctly Implemented DI Pattern
- `backend/src/controllers/index.js` - Central DI container
- AI controllers - Factory pattern with injected dependencies
- Drive controllers - Properly receives `googleOAuth` and `prisma`
- Gmail controllers - Factory pattern implementation
- Trello controllers - DI pattern followed

### ❌ DI Pattern Violations

#### 1. Direct Service Imports in Controllers
```javascript
// Files with violations:
backend/src/controllers/ai/langchainNlToSqlController.js:8
backend/src/controllers/gmail/syncMessages.js:7
backend/src/controllers/drive/syncFiles.js:7
backend/src/controllers/links/index.js:3

// Pattern:
import LangChainSqlService from '../../services/LangChainSqlService.js';
import { LinkDetectionService } from '../../services/LinkDetectionService.js';
```

#### 2. Hidden Singletons with Embedded Dependencies
```javascript
// Files with violations:
backend/src/services/SessionService.js
backend/src/services/TrelloService.js
backend/src/services/GoogleOAuthService.js

// Pattern:
class SessionService {
  constructor() {
    this.prisma = new PrismaClient(); // ❌ Embedded dependency
  }
}
const sessionService = new SessionService(); // ❌ Singleton
export default sessionService;
```

#### 3. Route-Level Dependency Creation
```javascript
// Files with violations:
backend/src/api/links.js:8
backend/src/api/auth.js:7

// Pattern:
const prisma = new PrismaClient(); // ❌ Route creating dependencies
const linkControllers = createLinkControllers(prisma);
```

## Implementation Plan

### Phase 1: Service Layer Refactoring

#### 1.1 Remove Singleton Exports
**Files to modify:**
- `backend/src/services/SessionService.js`
- `backend/src/services/TrelloService.js` 
- `backend/src/services/GoogleOAuthService.js`

**Changes:**
```javascript
// Before:
class SessionService {
  constructor() {
    this.prisma = new PrismaClient();
  }
}
const sessionService = new SessionService();
export default sessionService;

// After:
export class SessionService {
  constructor(prisma) {
    this.prisma = prisma;
  }
}
```

#### 1.2 Extract Embedded Dependencies
**Target:** `LinkDetectionService` and any other services with embedded Prisma instances

**Changes:**
```javascript
// Before:
export class LinkDetectionService {
  constructor() {
    this.prisma = new PrismaClient();
  }
}

// After:
export class LinkDetectionService {
  constructor(prisma) {
    this.prisma = prisma;
  }
}
```

### Phase 2: Controller Layer Refactoring

#### 2.1 Update Controller Factories
**Files to modify:**
- `backend/src/controllers/gmail/index.js`
- `backend/src/controllers/drive/index.js`
- `backend/src/controllers/links/index.js`

**Changes:**
```javascript
// Before:
export const syncMessages = (googleOAuth, prisma) => async (req, res, next) => {
  const linkDetectionService = new LinkDetectionService(prisma); // ❌
  // ...
};

// After:
export const syncMessages = (googleOAuth, prisma, linkDetectionService) => async (req, res, next) => {
  // Use injected linkDetectionService
  // ...
};
```

#### 2.2 Update Factory Functions
**Target:** All controller factory functions to accept additional service dependencies

```javascript
// Before:
export const createGmailControllers = ({ googleOAuth, prisma }) => ({
  syncMessages: syncMessages(googleOAuth, prisma),
  // ...
});

// After:
export const createGmailControllers = ({ googleOAuth, prisma, linkDetectionService }) => ({
  syncMessages: syncMessages(googleOAuth, prisma, linkDetectionService),
  // ...
});
```

### Phase 3: Central DI Container Enhancement

#### 3.1 Expand Main Controller Index
**File:** `backend/src/controllers/index.js`

**Changes:**
```javascript
// Current:
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const googleOAuth = new GoogleOAuthService();
const trelloService = new TrelloService();

// Enhanced:
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const googleOAuth = new GoogleOAuthService(prisma);
const trelloService = new TrelloService(prisma);
const sessionService = new SessionService(prisma);
const linkDetectionService = new LinkDetectionService(prisma);
const langchainService = new LangChainSqlService(process.env.OPENAI_API_KEY, prisma);

export const controllers = {
  ai: createAIControllers({ openai, prisma, langchainService }),
  trello: createTrelloControllers({ trelloService, prisma }),
  drive: createDriveControllers({ googleOAuth, prisma, linkDetectionService }),
  gmail: createGmailControllers({ googleOAuth, prisma, linkDetectionService }),
  links: createLinkControllers({ prisma, linkDetectionService }),
  auth: createAuthControllers({ googleOAuth, sessionService, prisma })
};
```

### Phase 4: Route Layer Updates

#### 4.1 Remove Route-Level Dependency Creation
**Files to modify:**
- `backend/src/api/links.js`
- `backend/src/api/auth.js`
- All route files that create their own dependencies

**Changes:**
```javascript
// Before:
const prisma = new PrismaClient();
const linkControllers = createLinkControllers(prisma);

// After:
import { controllers } from '../controllers/index.js';
const { links: linkControllers } = controllers;
```

### Phase 5: Testing Infrastructure

#### 5.1 Update Test Files
**Benefits of DI for testing:**
- Easy mocking of dependencies
- Isolated unit tests
- No database coupling in unit tests

**Test pattern:**
```javascript
// Example test setup with DI
const mockPrisma = { /* mock methods */ };
const mockLinkService = { /* mock methods */ };
const controllers = createGmailControllers({ 
  googleOAuth: mockGoogleOAuth, 
  prisma: mockPrisma, 
  linkDetectionService: mockLinkService 
});
```

## Migration Strategy

### Step-by-Step Implementation

1. **Start with Services** - Refactor service classes to accept dependencies
2. **Update Controllers** - Modify controller factories to accept new service dependencies  
3. **Enhance DI Container** - Add all services to central dependency container
4. **Update Routes** - Remove route-level dependency creation
5. **Update Tests** - Leverage DI for better test isolation

### Rollback Plan
- Each phase can be implemented incrementally
- Git commits after each successful phase
- Service interfaces remain unchanged during refactor

## Expected Benefits

### 1. **Improved Testability**
- Easy dependency mocking
- Isolated unit tests
- No database coupling in tests

### 2. **Enhanced Modularity**
- Clear dependency boundaries
- Easy service swapping
- Better separation of concerns

### 3. **Future-Proof Architecture**
- Micro-service splitting readiness
- Container orchestration support
- Easier deployment strategies

### 4. **Development Experience**
- Consistent patterns across codebase
- Easier debugging
- Clear dependency graphs

## Risk Assessment

### Low Risk
- Service interface changes are internal
- Existing functionality preserved
- Incremental implementation possible

### Mitigation
- Comprehensive testing after each phase
- Gradual rollout with feature flags if needed
- Maintain backward compatibility during transition

## Success Metrics

- [ ] All controllers follow factory pattern with DI
- [ ] No direct service imports in controllers
- [ ] No singleton service exports
- [ ] All dependencies injected through central container
- [ ] Test coverage maintained or improved
- [ ] Performance impact minimal (< 5ms latency increase)

## Timeline Estimate

- **Phase 1-2**: 2-3 days (Service and Controller refactoring)
- **Phase 3-4**: 1-2 days (DI Container and Routes)
- **Phase 5**: 1 day (Testing updates)
- **Total**: ~1 week of development time

## Dependencies

- No external dependencies required
- Existing codebase patterns provide blueprint
- Current test infrastructure sufficient