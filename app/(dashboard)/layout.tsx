"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { LayoutDashboard, User, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarContent } from "@/components/sidebar-content"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { CreateTransactionDialog } from "@/components/transactions/create-transaction-dialog"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(saved === "true")
    }
  }, [])

  const toggleSidebar = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <AppSidebar />
          <div className="flex items-center gap-2 font-bold text-lg">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline-block font-bold">Easy Budget</span>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4">
            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/profile">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline-block">Profile</span>
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside 
          className={cn(
            "hidden md:flex flex-col border-r bg-muted/30 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex-1 overflow-y-auto">
            <SidebarContent collapsed={isCollapsed} />
          </div>
          <div className="p-4 border-t mt-auto flex justify-center">
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "default"}
              className={cn(
                "flex items-center justify-center gap-2 transition-all",
                isCollapsed ? "w-9 h-9" : "w-full px-3"
              )}
              onClick={toggleSidebar}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <>
                  <PanelLeftClose className="h-5 w-5" />
                  <span className="text-sm font-medium">Collapse</span>
                </>
              )}
            </Button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-muted/5 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Sticky Floating Action Button (FAB) for authenticated routes */}
      <div className="fixed bottom-6 right-6 z-50">
        <CreateTransactionDialog trigger={
          <Button 
            className="h-14 w-14 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center p-0"
            title="Add Transaction"
          >
            <Plus className="h-6 w-6" />
          </Button>
        } />
      </div>
    </div>
  )
}
