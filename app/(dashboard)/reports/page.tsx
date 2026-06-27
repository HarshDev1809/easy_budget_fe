"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { Book, Category, Transaction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Loader2, 
  Share2, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  ArrowDownLeft, 
  ArrowUpRight 
} from "lucide-react"
import { toast } from "sonner"
import { encodePublicPayload, encryptPayload } from "@/lib/share-crypto"

export default function ReportsPage() {
  const [books, setBooks] = React.useState<Book[]>([])
  const [selectedBookId, setSelectedBookId] = React.useState<string>("")
  const [categories, setCategories] = React.useState<Category[]>([])
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)

  // Report filters
  const [selectedType, setSelectedType] = React.useState<"all" | "credit" | "debit">("all")
  const [dateRange, setDateRange] = React.useState<string>("all")
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  
  // Privacy
  const [privacy, setPrivacy] = React.useState<"public" | "private">("public")
  const [passcode, setPasscode] = React.useState<string>("")
  
  // Generated link state
  const [generatedLink, setGeneratedLink] = React.useState<string>("")
  const [copied, setCopied] = React.useState(false)

  // Fetch initial books
  React.useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true)
        const response = await apiClient("/api/v1/books")
        if (response.success) {
          setBooks(response.data)
          if (response.data.length > 0) {
            setSelectedBookId(response.data[0].id)
          }
        }
      } catch {
        toast.error("Failed to load books")
      } finally {
        setLoading(false)
      }
    }
    loadBooks()
  }, [])

  // Fetch categories & transactions when selected book changes
  React.useEffect(() => {
    if (!selectedBookId) return

    async function loadBookData() {
      try {
        // Fetch categories
        const catRes = await apiClient(`/api/v1/categories/${selectedBookId}`)
        if (catRes.success) {
          setCategories(catRes.data)
          // Default all categories checked
          setSelectedCategories(catRes.data.map((c: Category) => String(c.id)))
        }

        // Fetch transactions (higher limit to get report data)
        const txRes = await apiClient(`/api/v1/transactions?limit=500&bookId=${selectedBookId}`)
        if (txRes.success) {
          setTransactions(txRes.data)
        }
      } catch {
        toast.error("Failed to load details for the selected book")
      }
    }
    loadBookData()
  }, [selectedBookId])

  const selectedBook = books.find(b => b.id === selectedBookId)

  // Filter transactions for preview and generating payload
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(txn => {
      // 1. Filter by type
      if (selectedType !== "all" && txn.type !== selectedType) return false
      
      // 2. Filter by category
      if (txn.categoryId) {
        if (!selectedCategories.includes(String(txn.categoryId))) return false
      }

      // 3. Filter by date range
      if (dateRange !== "all") {
        const txnDate = new Date(txn.paidAt)
        const now = new Date()
        if (dateRange === "7days") {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(now.getDate() - 7)
          if (txnDate < sevenDaysAgo) return false
        } else if (dateRange === "30days") {
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(now.getDate() - 30)
          if (txnDate < thirtyDaysAgo) return false
        } else if (dateRange === "month") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          if (txnDate < startOfMonth) return false
        }
      }
      return true
    })
  }, [transactions, selectedType, selectedCategories, dateRange])

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleSelectAllCategories = () => {
    setSelectedCategories(categories.map(c => String(c.id)))
  }

  const handleDeselectAllCategories = () => {
    setSelectedCategories([])
  }

  const generateLink = async () => {
    if (!selectedBook) {
      toast.error("Please select a book first")
      return
    }

    if (privacy === "private" && (!passcode || passcode.length < 4)) {
      toast.error("Please enter at least a 4-digit passcode for Private sharing")
      return
    }

    try {
      setGenerating(true)
      
      // Prepare details to share
      const sharePayload = {
        bookName: selectedBook.name,
        baseAmount: selectedBook.baseAmount,
        generatedAt: new Date().toISOString(),
        transactions: filteredTransactions.map(t => ({
          name: t.name,
          amount: t.amount,
          type: t.type,
          categoryName: t.categoryName || (t.categoryId ? categories.find(c => String(c.id) === String(t.categoryId))?.name : null) || "General",
          paidAt: t.paidAt
        })),
        filters: {
          type: selectedType,
          dateRange,
          categories: selectedCategories.map(id => categories.find(c => String(c.id) === id)?.name || id)
        },
        isPrivate: privacy === "private"
      }

      const jsonString = JSON.stringify(sharePayload)
      let token = ""

      if (privacy === "private") {
        token = await encryptPayload(jsonString, passcode)
      } else {
        token = encodePublicPayload(jsonString)
      }

      const origin = window.location.origin
      const shareUrl = `${origin}/share?t=${token}${privacy === "private" ? "&p=1" : ""}`
      setGeneratedLink(shareUrl)
      setCopied(false)
      toast.success("Shareable report link generated successfully!")
    } catch (err) {
      toast.error("Failed to generate secure link: " + (err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = () => {
    if (!generatedLink) return
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center">
        <Card className="p-8 border-dashed">
          <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No books found</h2>
          <p className="text-muted-foreground mb-4">You need to create a book and log some transactions before generating reports.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Share Transactions</h1>
        <p className="text-muted-foreground text-sm">
          Select book details and securely share filtered transaction logs client-side.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left pane: Configuration Form */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Report Settings</CardTitle>
              <CardDescription className="text-xs">Configure parameters for sharing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {/* Select Book */}
              <div className="space-y-1.5">
                <Label htmlFor="book-select">Select Book</Label>
                <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                  <SelectTrigger id="book-select">
                    <SelectValue placeholder="Select Book" />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Type */}
              <div className="space-y-1.5">
                <Label htmlFor="type-select">Transaction Type</Label>
                <Select value={selectedType} onValueChange={(val) => setSelectedType(val as "all" | "credit" | "debit")}>
                  <SelectTrigger id="type-select">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="credit">Income (Credit) Only</SelectItem>
                    <SelectItem value="debit">Expenses (Debit) Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Select Date Range */}
              <div className="space-y-1.5">
                <Label htmlFor="date-select">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger id="date-select">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Privacy Setting */}
              <div className="space-y-1.5">
                <Label>Privacy Level</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={privacy === "public" ? "default" : "outline"}
                    className="w-full text-xs gap-1"
                    onClick={() => setPrivacy("public")}
                  >
                    <Unlock className="h-3 w-3" />
                    Public
                  </Button>
                  <Button
                    type="button"
                    variant={privacy === "private" ? "default" : "outline"}
                    className="w-full text-xs gap-1"
                    onClick={() => setPrivacy("private")}
                  >
                    <Lock className="h-3 w-3" />
                    Private
                  </Button>
                </div>
              </div>

              {/* Passcode (if private) */}
              {privacy === "private" && (
                <div className="space-y-1.5">
                  <Label htmlFor="passcode">Encryption Passcode</Label>
                  <Input
                    id="passcode"
                    type="password"
                    placeholder="Enter passcode (e.g. 1234)"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="h-9"
                  />
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    This passcode is used to encrypt report data client-side. The recipient will need this exact passcode to unlock the report.
                  </p>
                </div>
              )}

              {/* Generate Button */}
              <Button
                type="button"
                className="w-full mt-2"
                onClick={generateLink}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Generate Report Link
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Categories Selector */}
          {categories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Categories</CardTitle>
                  <div className="flex gap-2">
                    <button onClick={handleSelectAllCategories} className="text-[10px] font-semibold text-primary hover:underline">All</button>
                    <span className="text-[10px] text-muted-foreground">|</span>
                    <button onClick={handleDeselectAllCategories} className="text-[10px] font-semibold text-primary hover:underline">None</button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {categories.map(c => {
                  const idStr = String(c.id)
                  const isChecked = selectedCategories.includes(idStr)
                  return (
                    <div key={c.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${c.id}`}
                        checked={isChecked}
                        onCheckedChange={() => handleCategoryToggle(idStr)}
                      />
                      <label
                        htmlFor={`cat-${c.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {c.name}
                      </label>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right pane: Preview and Link Results */}
        <div className="md:col-span-2 space-y-6">
          {/* Result Card */}
          {generatedLink && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share Link Ready
                </CardTitle>
                <CardDescription className="text-xs">
                  Copy the link below. If it is private, make sure to share the passcode with your recipient as well.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={generatedLink}
                    className="flex-1 bg-background select-all h-9 text-xs"
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {privacy === "private" && (
                  <div className="text-xs border rounded p-2.5 bg-yellow-500/10 border-yellow-500/20 text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>
                      Private Report Passcode: <strong className="font-mono text-sm">{passcode}</strong>. You must send this passcode separately.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Live Preview Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex justify-between items-center">
                <span>Live Report Preview</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                  {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? "" : "s"} selected
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Showing transactions that match your filter choices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">No transactions match your current settings.</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  {/* Table View */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                          <th className="py-2.5 px-3">Transaction</th>
                          <th className="py-2.5 px-3">Date Paid</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredTransactions.slice(0, 15).map((txn, index) => {
                          const isCredit = txn.type === "credit"
                          const catName = txn.categoryName || (
                            txn.categoryId ? categories.find(c => String(c.id) === String(txn.categoryId))?.name : null
                          ) || "General"

                          return (
                            <tr key={txn.id || index} className="hover:bg-muted/30">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5 font-medium">
                                  {isCredit ? (
                                    <ArrowDownLeft className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                  ) : (
                                    <ArrowUpRight className="h-3.5 w-3.5 text-destructive shrink-0" />
                                  )}
                                  <span className="truncate max-w-[120px] sm:max-w-[200px]" title={txn.name}>{txn.name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground">
                                {new Intl.DateTimeFormat("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                }).format(new Date(txn.paidAt))}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-0.5 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                                  {catName}
                                </span>
                              </td>
                              <td className={`py-2.5 px-3 text-right font-semibold ${isCredit ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                                {isCredit ? "+" : "-"}₹{txn.amount}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredTransactions.length > 15 && (
                    <div className="p-2 bg-muted/20 border-t text-center text-[11px] text-muted-foreground">
                      And {filteredTransactions.length - 15} more transactions will be included in the report.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
