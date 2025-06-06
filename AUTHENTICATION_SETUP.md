# Authentication Setup

## Overview
The application now uses real Google OAuth authentication integrated with the backend. The frontend handles authentication state management and redirects while the backend manages sessions and OAuth flow.

## Authentication Flow

### 1. Login Process
1. User clicks "Continue with Google" on `/login` page
2. Frontend calls `/auth/google` endpoint to get OAuth URL
3. User is redirected to Google OAuth consent screen
4. After consent, Google redirects to backend `/auth/google/callback`
5. Backend exchanges code for tokens, creates user/session, sets HTTP-only cookie
6. Backend redirects to frontend `/auth/callback?success=true`
7. Frontend `AuthCallback` component handles the redirect and completes login

### 2. Authentication State
- Managed by `AuthContext` (`frontend/src/contexts/AuthContext.jsx`)
- Uses HTTP-only cookies for session management (secure)
- Automatically checks auth status on app load via `/auth/status` endpoint

### 3. Protected Routes
- `ProtectedRoute` component wraps routes requiring authentication
- Redirects unauthenticated users to `/login`
- Stores intended destination for post-login redirect

### 4. Logout Process
- Calls `/auth/logout` endpoint to clear server session
- Clears authentication state and redirects to `/login`

## Key Components

### Frontend
- `AuthContext` - Authentication state management
- `ProtectedRoute` - Route protection wrapper
- `LoginPage` - Login interface
- `AuthCallback` - Handles OAuth redirects
- `LoginForm` - Google OAuth login button

### Backend
- `/auth/google` - Initiates OAuth flow
- `/auth/google/callback` - Handles OAuth callback
- `/auth/status` - Returns current auth status
- `/auth/logout` - Clears session
- `requireAuth` middleware - Protects API endpoints

## Environment Variables

### Backend
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret  
- `GOOGLE_REDIRECT_URI` - Should be `http://localhost:3001/auth/google/callback`
- `FRONTEND_URL` - Frontend URL (default: `http://localhost:5173`)

### Frontend
- `VITE_API_URL` - Backend API URL (default: `http://localhost:3001`)

## Route Structure

### Public Routes
- `/login` - Login page
- `/auth/callback` - OAuth callback handler
- `/app` - OldDashboard (unprotected as requested)

### Protected Routes
- `/` - Redirects to `/gmail`
- `/gmail` - Gmail view
- `/drive` - Drive view  
- `/trello` - Trello view
- `/chat` - Chat view

## Security Features
- HTTP-only cookies prevent XSS attacks
- CORS configured for frontend domain
- Session-based authentication
- Automatic token refresh (handled by backend)
- Secure cookie settings in production

## Usage Notes
- Users must authenticate with Google to access protected routes
- Sessions persist for 24 hours
- Automatic redirect to intended page after login
- Graceful error handling for OAuth failures
- Real user data displayed in sidebar (name, email, initials) 