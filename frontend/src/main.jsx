import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import OldDashboard from '@/OldDashboard.jsx'
import { queryClient } from '@/lib/queryClient'
import App from '@/components/App'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Temporarily keep AuthProvider during migration */}
        {/*<AuthProvider>*/}
          <App />
        {/*</AuthProvider>*/}
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
