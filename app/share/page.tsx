"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { decodePublicPayload, decryptPayload } from "@/lib/share-crypto"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Lock, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Tag, 
  Search, 
  Download, 
  TrendingUp, 
  TrendingDown
} from "lucide-react"
import { toast } from "sonner"

interface SharedTransaction {
  name: string;
  amount: string;
  type: "credit" | "debit";
  categoryName: string | null;
  paidAt: string;
}

interface SharedReportPayload {
  bookName: string;
  baseAmount: number;
  generatedAt: string;
  transactions: SharedTransaction[];
  filters: {
    type: string;
    dateRange: string;
    categories: string[];
  };
  isPrivate: boolean;
}

// Suspense wrapper to handle useSearchParams safely in Next.js App Router
export default function SharePage() {
  return (
    <React.Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted/10">
        <p className="text-muted-foreground text-sm font-medium">Loading share details...</p>
      </div>
    }>
      <SharePageContent />
    </React.Suspense>
  )
}

function SharePageContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("t") || ""
  const isPrivate = searchParams.get("p") === "1"

  const [passcode, setPasscode] = React.useState("")
  const [unlockedPayload, setUnlockedPayload] = React.useState<SharedReportPayload | null>(null)
  const [unlocking, setUnlocking] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Frontend Search & Filtering state
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedType, setSelectedType] = React.useState<"all" | "credit" | "debit">("all")

  // Auto-decrypt if it's public
  React.useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Invalid sharing link. No token found.")
      return
    }

    if (!isPrivate) {
      try {
        const decoded = decodePublicPayload(token)
        const parsed = JSON.parse(decoded) as SharedReportPayload
        setUnlockedPayload(parsed)
      } catch {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setError("Failed to decode the sharing payload. The link might be broken.")
      }
    }
  }, [token, isPrivate])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passcode) {
      toast.error("Please enter the passcode")
      return
    }

    try {
      setUnlocking(true)
      setError(null)
      const decrypted = await decryptPayload(token, passcode)
      const parsed = JSON.parse(decrypted) as SharedReportPayload
      setUnlockedPayload(parsed)
      toast.success("Report unlocked successfully!")
    } catch {
      toast.error("Incorrect passcode. Please try again.")
    } finally {
      setUnlocking(false)
    }
  }

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!unlockedPayload) return { income: 0, expenses: 0, net: 0 }
    
    let income = 0
    let expenses = 0
    
    unlockedPayload.transactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0
      if (t.type === "credit") {
        income += amt
      } else {
        expenses += amt
      }
    })

    return {
      income,
      expenses,
      net: income - expenses
    }
  }, [unlockedPayload])

  // Filter transactions based on client-side search/type filter
  const filteredTransactions = React.useMemo(() => {
    if (!unlockedPayload) return []
    
    return unlockedPayload.transactions.filter(txn => {
      // Filter by type
      if (selectedType !== "all" && txn.type !== selectedType) return false
      
      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const nameMatch = txn.name.toLowerCase().includes(query)
        const catMatch = txn.categoryName?.toLowerCase().includes(query) || false
        const amtMatch = txn.amount.includes(query)
        if (!nameMatch && !catMatch && !amtMatch) return false
      }
      
      return true
    })
  }, [unlockedPayload, searchQuery, selectedType])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const handleDownloadCSV = () => {
    if (!unlockedPayload) return

    const headers = ["Name", "Amount", "Type", "Category", "Date Paid"]
    const rows = unlockedPayload.transactions.map(t => [
      t.name,
      t.amount,
      t.type,
      t.categoryName || "General",
      new Date(t.paidAt).toLocaleDateString()
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `shared_report_${unlockedPayload.bookName.replace(/\s+/g, "_")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Render error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/5">
        <Card className="w-full max-w-md shadow-lg border-destructive/20 bg-destructive/5 text-center">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-destructive">Sharing Link Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry / Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render passcode protection screen
  if (isPrivate && !unlockedPayload) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/5">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Secure Report</CardTitle>
            <CardDescription>
              This transaction log is private and encrypted. Enter the passcode to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="passcode-input">Passcode</Label>
                <Input
                  id="passcode-input"
                  type="password"
                  placeholder="Enter access passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="text-center text-lg tracking-widest font-mono"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full font-semibold" disabled={unlocking}>
                {unlocking ? "Decrypting..." : "Unlock Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render unlocked report
  if (unlockedPayload) {
    const { bookName, baseAmount, generatedAt } = unlockedPayload

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        {/* Report Header */}
        <Card className="border-primary/20">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] bg-primary/15 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Shared Report
              </span>
              <CardTitle className="text-3xl font-bold mt-1.5">{bookName}</CardTitle>
              <CardDescription className="flex items-center gap-1.5 text-xs mt-1">
                <Calendar className="h-3.5 w-3.5" />
                Generated on: {new Date(generatedAt).toLocaleString()}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleDownloadCSV}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </CardHeader>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-muted/10">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium">Base Budget</CardDescription>
              <CardTitle className="text-lg font-bold">{formatCurrency(baseAmount)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-green-500/5 border-green-500/10">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Total Income
              </CardDescription>
              <CardTitle className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.income)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-destructive/5 border-destructive/10">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium text-destructive flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Total Expenses
              </CardDescription>
              <CardTitle className="text-lg font-bold text-destructive">
                {formatCurrency(stats.expenses)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className={stats.net >= 0 ? "bg-primary/5" : "bg-destructive/5"}>
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium">Net Savings</CardDescription>
              <CardTitle className={`text-lg font-bold ${stats.net >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatCurrency(stats.net)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Transactions Filtering Control */}
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shared logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as "all" | "credit" | "debit")}
                className="w-full h-9 rounded-md border border-input px-3 py-1 bg-background text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Types</option>
                <option value="debit">Expenses (Debit)</option>
                <option value="credit">Income (Credit)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Shared Ledger</CardTitle>
              <CardDescription className="text-xs">
                A verified breakdown of transactions in this report.
              </CardDescription>
            </div>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {filteredTransactions.length} item{filteredTransactions.length === 1 ? "" : "s"} shown
            </span>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 border-t border-dashed">
                <p className="text-sm text-muted-foreground">No matching transactions found.</p>
              </div>
            ) : (
              <div>
                {/* Desktop View */}
                <div className="hidden sm:block divide-y divide-border border-t">
                  {filteredTransactions.map((txn, index) => {
                    const isCredit = txn.type === "credit"
                    return (
                      <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                            isCredit ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-destructive/10 text-destructive"
                          }`}>
                            {isCredit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate max-w-[250px] sm:max-w-md">
                              {txn.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Paid: {new Intl.DateTimeFormat("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                }).format(new Date(txn.paidAt))}
                              </span>
                              <span className="text-muted-foreground/30">•</span>
                              <span className="inline-flex items-center gap-0.5 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                                <Tag className="h-2.5 w-2.5" />
                                {txn.categoryName || "General"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${isCredit ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                            {isCredit ? "+" : "-"}₹{parseFloat(txn.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                            {txn.type}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden space-y-3 p-4 border-t">
                  {filteredTransactions.map((txn, index) => {
                    const isCredit = txn.type === "credit"
                    return (
                      <Card key={index} className="p-4 flex flex-col gap-3 relative shadow-sm border border-border">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                              isCredit ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-destructive/10 text-destructive"
                            }`}>
                              {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate max-w-[160px]">
                                {txn.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                {txn.type}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-bold ${isCredit ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                              {isCredit ? "+" : "-"}₹{parseFloat(txn.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between border-t pt-2 mt-1">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Intl.DateTimeFormat("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              }).format(new Date(txn.paidAt))}
                            </span>
                            <span className="inline-flex items-center gap-0.5 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider">
                              <Tag className="h-2.5 w-2.5" />
                              {txn.categoryName || "General"}
                            </span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
