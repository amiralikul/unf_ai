import { useAuth } from '@/hooks/useAuth'
import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-lg text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Store the intended destination for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
