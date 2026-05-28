"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard, LogOut, User } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchSession() {
      try {
        const response = await apiClient("/api/v1/user/session")
        if (response.success) {
          setUser(response.data.user)
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Session fetch failed:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [router])

  async function handleLogout() {
    try {
      await apiClient("/api/auth/sign-out", { method: "POST" })
      toast.success("Logged out successfully")
      router.push("/login")
    } catch (error) {
      toast.error("Logout failed")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <span>Easy Budget</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{user?.name || user?.email}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
          <p className="text-muted-foreground text-lg">Here's an overview of your finances.</p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Balance</CardDescription>
              <CardTitle className="text-2xl">$0.00</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">+0% from last month</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Monthly Income</CardDescription>
              <CardTitle className="text-2xl">$0.00</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">No data available</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Monthly Expenses</CardDescription>
              <CardTitle className="text-2xl">$0.00</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">No data available</div>
            </CardContent>
          </Card>
        </div>

        <Card className="min-h-[300px] flex items-center justify-center border-dashed">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">No transactions found.</p>
            <Button variant="outline">Add your first transaction</Button>
          </div>
        </Card>
      </main>
    </div>
  )
}
