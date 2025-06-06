// /**
//  * @deprecated This context-based authentication is deprecated.
//  * Please use the useAuth hook from '@/hooks/useAuth' instead.
//  *
//  * Migration guide:
//  * 1. Replace import { useAuth } from '@/contexts/AuthContext'
//  *    with import { useAuth } from '@/hooks/useAuth'
//  * 2. Use the hook directly in your components
//  * 3. Remove AuthProvider from your component tree
//  */
//
// import { createContext, useContext, useState, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import { api } from '@/lib/api'
//
// const AuthContext = createContext()
//
// /**
//  * @deprecated Use the useAuth hook from '@/hooks/useAuth' instead.
//  */
// export function AuthProvider({ children }) {
//   console.warn(
//     'AuthProvider is deprecated. Please migrate to the useAuth hook from @/hooks/useAuth. ' +
//     'See the comment at the top of this file for migration instructions.'
//   );
//   const [isAuthenticated, setIsAuthenticated] = useState(false)
//   const [isLoading, setIsLoading] = useState(true)
//   const [user, setUser] = useState(null)
//   const [error, setError] = useState(null)
//   const navigate = useNavigate()
//   const location = useLocation()
//
//   useEffect(() => {
//     checkAuthStatus()
//   }, [])
//
//   // Check if user is authenticated on app load
//   const checkAuthStatus = async () => {
//     try {
//       setIsLoading(true)
//       const response = await api.getAuthStatus()
//
//       if (response.isAuthenticated && response.user) {
//         setIsAuthenticated(true)
//         setUser(response.user)
//       } else {
//         setIsAuthenticated(false)
//         setUser(null)
//       }
//     } catch (error) {
//       console.error('Auth status check failed:', error)
//       setIsAuthenticated(false)
//       setUser(null)
//       setError('Failed to check authentication status')
//     } finally {
//       setIsLoading(false)
//     }
//   }
//
//   // Initiate Google OAuth login
//   const login = async () => {
//     try {
//       setError(null)
//       const response = await api.getGoogleAuthUrl()
//
//       if (response.authUrl) {
//         // Redirect to Google OAuth
//         window.location.href = response.authUrl
//       } else {
//         throw new Error('Failed to get authentication URL')
//       }
//     } catch (error) {
//       console.error('Login failed:', error)
//       setError(error.message || 'Login failed')
//     }
//   }
//
//   // Handle successful OAuth callback
//   const handleAuthCallback = async () => {
//     // This will be called after successful OAuth callback
//     // The backend handles the OAuth flow and sets the session cookie
//     await checkAuthStatus()
//
//     // Redirect to intended destination or default to home
//     const from = location.state?.from?.pathname || '/'
//     navigate(from, { replace: true })
//   }
//
//   // Logout user
//   const logout = async () => {
//     try {
//       await api.logout()
//     } catch (error) {
//       console.error('Logout failed:', error)
//       // Continue with logout even if API call fails
//     } finally {
//       setIsAuthenticated(false)
//       setUser(null)
//       navigate('/login', { replace: true })
//     }
//   }
//
//   const value = {
//     isAuthenticated,
//     isLoading,
//     user,
//     error,
//     login,
//     logout,
//     checkAuthStatus,
//     handleAuthCallback
//   }
//
//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }
//
// /**
//  * @deprecated Use the useAuth hook from '@/hooks/useAuth' instead.
//  */
// export function useAuth() {
//   console.warn(
//     'This useAuth from AuthContext is deprecated. ' +
//     'Please import useAuth from @/hooks/useAuth instead.'
//   );
//
//   const context = useContext(AuthContext)
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }
