"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = React.useState<{ name?: string, email?: string } | null>(null)
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
        <p className="text-muted-foreground text-lg">Here&apos;s an overview of your finances.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Balance</CardDescription>
            <CardTitle className="text-2xl">₹0.00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">+0% from last month</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Income</CardDescription>
            <CardTitle className="text-2xl">₹0.00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">No data available</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Expenses</CardDescription>
            <CardTitle className="text-2xl">₹0.00</CardTitle>
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
    </div>
  )
}
