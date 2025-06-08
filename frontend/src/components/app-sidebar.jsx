"use client"

import { Mail, HardDrive, Trello, MessageSquare, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

export function AppSidebar({ activeView }) {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  
  const menuItems = [
    {
      id: "gmail",
      label: "Gmail",
      icon: Mail,
    },
    {
      id: "drive",
      label: "Google Drive",
      icon: HardDrive,
    },
    {
      id: "trello",
      label: "Trello",
      icon: Trello,
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
    },
  ]

  const handleLogout = () => {
    logout()
  }

  // Get user initials for avatar fallback
  const getUserInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-center p-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user?.name || "User"} />
          <AvatarFallback>{getUserInitials(user?.name)}</AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <p className="text-sm font-medium">{user?.name || 'User Dashboard'}</p>
          <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton 
                isActive={activeView === item.id} 
                onClick={() => navigate(`/${item.id}`)}
                className="hover:cursor-pointer"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
        <div className="text-xs text-muted-foreground">Dashboard v1.0</div>
      </SidebarFooter>
    </Sidebar>
  );
}
