import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from './lib/api'
import { useAuthStatus, useCurrentUser, useGoogleAuthUrl, useLogout, authUtils } from './hooks/useAuth'
import { useDriveFiles } from './hooks/useDriveFiles'
import { useGmailMessages } from './hooks/useGmailMessages'
import { useTrelloBoards } from './hooks/useTrelloBoards'

function App() {
  const [count, setCount] = useState(0)

  const { data: driveFiles } = useDriveFiles();
  const { data: gmailMessages } = useGmailMessages();
  const { data: trelloBoards } = useTrelloBoards();

  console.log(driveFiles, gmailMessages, trelloBoards);


  // Handle OAuth callback on page load
  useEffect(() => {
    const result = authUtils.handleOAuthCallback();
    if (result.success) {
      console.log('OAuth success!');
      window.location.reload(); // Refresh to update auth state
    } else if (result.error) {
      console.error('OAuth failed:', result.error);
    }
  }, []);
  
  // Test backend connection
  const { data: healthData, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Auth hooks
  const { data: authStatus, isLoading: authLoading } = useAuthStatus();
  const { data: currentUser } = useCurrentUser();
  const googleAuthMutation = useGoogleAuthUrl();
  const logoutMutation = useLogout();

  const isAuthenticated = authUtils.isAuthenticated();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 text-white">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 shadow-xl border border-white/20">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          🚀 Unframe AI
        </h1>
        <p className="text-lg text-center mb-4 text-gray-300">
          Full-Stack AI-Powered Drive/Gmail/Trello App
        </p>
        <div className="flex flex-col items-center space-y-4">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center space-y-3">
              <button 
                onClick={() => googleAuthMutation.mutate()}
                disabled={googleAuthMutation.isPending}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-semibold transition-colors duration-200 shadow-lg flex items-center space-x-2"
              >
                <span>🔐</span>
                <span>
                  {googleAuthMutation.isPending ? 'Connecting...' : 'Login with Google'}
                </span>
              </button>
              <p className="text-sm text-gray-400">Connect your Google account to access Drive & Gmail</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="text-center">
                <p className="text-lg">Welcome, {currentUser?.name || 'User'}!</p>
                <p className="text-sm text-gray-400">{currentUser?.email}</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setCount((count) => count + 1)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors duration-200 shadow-lg"
                >
                  Count: {count}
                </button>
                <button 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg font-semibold transition-colors duration-200 shadow-lg"
                >
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className={`px-3 py-1 rounded-full ${
              healthError ? 'bg-red-500/20 text-red-400' : 
              healthLoading ? 'bg-yellow-500/20 text-yellow-400' :
              healthData ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
            }`}>
              {healthError ? '❌ Backend Error' : 
               healthLoading ? '⏳ Connecting...' :
               healthData ? '✅ Backend Ready' : '⚠️ Backend Unknown'}
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">✅ Frontend Setup</span>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">⚡ Tailwind CSS</span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full">🔄 React Query</span>
            <span className={`px-3 py-1 rounded-full ${
              isAuthenticated ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
            }`}>
              {isAuthenticated ? '🔑 Authenticated' : '🔓 Not Authenticated'}
            </span>
          </div>
          {healthData && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Last backend ping: {new Date(healthData.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
