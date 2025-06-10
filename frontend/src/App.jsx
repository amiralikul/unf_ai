import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/AppSidebar.jsx"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar.jsx"
import GmailPage from "@/pages/GmailPage.jsx"
import DrivePage from "@/pages/DrivePage.jsx"
import TrelloPage from "@/pages/TrelloPage.jsx"
import ChatPage from "@/pages/ChatPage.jsx"
import ProtectedRoute from "@/components/ProtectedRoute.jsx"
import LoginPage from "@/pages/LoginPage.jsx"
import AuthCallback from "@/components/AuthCallback.jsx"

export default function App() {
  const location = useLocation()
  const activeView = location.pathname.slice(1) || "gmail"

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      
      <Route path="/*" element={
        <ProtectedRoute>
          <SidebarProvider>
            <div className="flex h-screen w-full overflow-hidden">
              <AppSidebar activeView={activeView} />
              <SidebarInset>
                <div className="h-full w-full overflow-auto">
                  <Routes>
                    <Route path="/" element={<Navigate to="/gmail" replace />} />
                    <Route path="/gmail" element={<GmailPage />} />
                    <Route path="/drive" element={<DrivePage />} />
                    <Route path="/trello" element={<TrelloPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                  </Routes>
                </div>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </ProtectedRoute>
      } />
    </Routes>
  );
}
