import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth, useGoogleAuthUrl, useLogout } from '@/hooks/useAuth'
import { useDriveFiles, useSyncDriveFiles } from '@/hooks/useDriveFiles'
import { useGmailMessages, useSyncGmailMessages } from '@/hooks/useGmailMessages'
import { useTrelloBoards, useSyncTrelloData } from '@/hooks/useTrelloBoards'
import { useTrelloCards } from '@/hooks/useTrelloCards'
import { useAIQuery, useAIStats } from '@/hooks/useAI'

function OldDashboard() {
  const [count, setCount] = useState(0)
  const [aiQuery, setAiQuery] = useState('')

  // Data hooks with new response format
  const { data: driveFiles, isLoading: driveLoading } = useDriveFiles();
  const { data: gmailMessages, isLoading: gmailLoading } = useGmailMessages();
  const { data: trelloBoards, isLoading: trelloLoading } = useTrelloBoards();
  const { data: trelloCards } = useTrelloCards(trelloBoards?.boards?.[0]?.id);
  const { data: aiStats } = useAIStats();

  // Sync mutations
  const syncDriveFiles = useSyncDriveFiles();
  const syncGmailMessages = useSyncGmailMessages();
  const syncTrelloData = useSyncTrelloData();
  const aiQueryMutation = useAIQuery();

  console.log('📊 Data:', {
    driveFiles: driveFiles?.files || driveFiles,
    gmailMessages: gmailMessages?.messages || gmailMessages,
    trelloBoards: trelloBoards?.boards || trelloBoards,
    trelloCards: trelloCards?.cards || trelloCards,
    aiStats
  });


  // Test backend connection
  const { data: healthData, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Auth hooks
  const { data: authData, isLoading: authLoading } = useAuth();
  const googleAuthMutation = useGoogleAuthUrl();
  const logoutMutation = useLogout();

  const isAuthenticated = authData?.isAuthenticated || false;
  const currentUser = authData?.user;

  // Debug info
  console.log('🔐 Auth Debug:', {
    isAuthenticated,
    authLoading,
    currentUser
  });

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
              <div className="flex flex-col space-y-4">
                {/* Data Status */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="font-semibold">Drive Files</div>
                    <div className="text-gray-300">
                      {driveLoading ? 'Loading...' : `${driveFiles?.files?.length || 0} files`}
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="font-semibold">Gmail Messages</div>
                    <div className="text-gray-300">
                      {gmailLoading ? 'Loading...' : `${gmailMessages?.messages?.length || 0} messages`}
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="font-semibold">Trello Boards</div>
                    <div className="text-gray-300">
                      {trelloLoading ? 'Loading...' : `${trelloBoards?.boards?.length || 0} boards`}
                    </div>
                  </div>
                </div>

                {/* Sync Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => syncDriveFiles.mutate()}
                    disabled={syncDriveFiles.isPending}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-lg"
                  >
                    {syncDriveFiles.isPending ? 'Syncing...' : 'Sync Drive'}
                  </button>
                  <button
                    onClick={() => syncGmailMessages.mutate()}
                    disabled={syncGmailMessages.isPending}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-lg"
                  >
                    {syncGmailMessages.isPending ? 'Syncing...' : 'Sync Gmail'}
                  </button>
                  <button
                    onClick={() => syncTrelloData.mutate()}
                    disabled={syncTrelloData.isPending}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-lg"
                  >
                    {syncTrelloData.isPending ? 'Syncing...' : 'Sync Trello'}
                  </button>
                </div>

                {/* AI Query Interface */}
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="font-semibold mb-2">🤖 AI Assistant</div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="Ask about your files, emails, or cards..."
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && aiQuery.trim()) {
                          aiQueryMutation.mutate({ query: aiQuery.trim() });
                        }
                      }}
                    />
                    <button
                      onClick={() => aiQuery.trim() && aiQueryMutation.mutate({ query: aiQuery.trim() })}
                      disabled={aiQueryMutation.isPending || !aiQuery.trim()}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 rounded-lg font-semibold transition-colors duration-200 shadow-lg"
                    >
                      {aiQueryMutation.isPending ? 'Thinking...' : 'Ask AI'}
                    </button>
                  </div>
                  {aiQueryMutation.data && (
                    <div className="mt-3 p-3 bg-white/10 rounded-lg">
                      <div className="text-sm font-semibold text-orange-300">AI Response:</div>
                      <div className="text-sm mt-1">{aiQueryMutation.data.response}</div>
                    </div>
                  )}
                  {aiQueryMutation.error && (
                    <div className="mt-3 p-3 bg-red-500/20 rounded-lg">
                      <div className="text-sm font-semibold text-red-300">Error:</div>
                      <div className="text-sm mt-1">{aiQueryMutation.error.message}</div>
                    </div>
                  )}
                </div>

                {/* Control Buttons */}
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

export default OldDashboard
