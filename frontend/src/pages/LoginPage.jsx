import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoginForm from '@/components/LoginForm.jsx'

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [oauthError, setOauthError] = useState(null)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    // Check for OAuth error from navigation state
    if (location.state?.error) {
      setOauthError(location.state.error)
      // Clear the error from navigation state
      navigate('/login', { replace: true })
    }
  }, [location.state, navigate])

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

  if (isAuthenticated) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <LoginForm oauthError={oauthError} />
      </div>
    </div>
  )
}
