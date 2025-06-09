import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import GmailView from "@/components/views/gmail-view"
import DriveView from "@/components/views/drive-view"
import TrelloView from "@/components/views/trello-view"
import ChatView from "@/components/views/chat-view"
import ProtectedRoute from "@/components/ProtectedRoute"
import LoginPage from "@/pages/LoginPage"
import AuthCallback from "@/components/AuthCallback"

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
                    <Route path="/gmail" element={<GmailView />} />
                    <Route path="/drive" element={<DriveView />} />
                    <Route path="/trello" element={<TrelloView />} />
                    <Route path="/chat" element={<ChatView />} />
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
