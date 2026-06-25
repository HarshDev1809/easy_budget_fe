"use client"

import * as React from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Trash2,
  Calendar,
  Loader2,
  AlertCircle,
  Tag,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import { Transaction, Category } from "@/lib/types"
import { CreateTransactionDialog } from "./create-transaction-dialog"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { DeleteTransactionDialog } from "./delete-transaction-dialog"

interface TransactionListProps {
  bookId: string
  categories: Category[]
  onMutation?: () => void
}

export function TransactionList({
  bookId,
  categories,
  onMutation,
}: TransactionListProps) {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [nextCursor, setNextCursor] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Filter & Search values
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("all")
  const [selectedType, setSelectedType] = React.useState<"all" | "credit" | "debit">("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("")

  // Sort values
  const [sortBy, setSortBy] = React.useState<"createdAt" | "paidAt" | "price" | "alphabet">("createdAt")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")

  // Deletion modal state
  const [transactionToDelete, setTransactionToDelete] = React.useState<Transaction | null>(null)

  // Debounce search query
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Reset category filter if selected category does not exist in the book's categories anymore
  React.useEffect(() => {
    if (
      selectedCategoryId !== "all" &&
      selectedCategoryId !== "none" &&
      categories.length > 0 &&
      !categories.some((c) => String(c.id) === selectedCategoryId)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCategoryId("all")
    }
  }, [categories, selectedCategoryId])

  // Paginated fetch logic
  const fetchTransactions = React.useCallback(
    async (cursorValue: string | null = null, isInitial: boolean = true) => {
      if (isInitial) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      try {
        let endpoint = `/api/v1/transactions?limit=10&bookId=${bookId}`
        
        if (selectedCategoryId && selectedCategoryId !== "all") {
          endpoint += `&categoryId=${selectedCategoryId === "none" ? "null" : selectedCategoryId}`
        }
        if (selectedType && selectedType !== "all") {
          endpoint += `&transactionType=${selectedType}`
        }
        if (debouncedSearchQuery) {
          endpoint += `&search=${encodeURIComponent(debouncedSearchQuery)}`
        }
        if (sortBy) {
          endpoint += `&sortBy=${sortBy}`
        }
        if (sortOrder) {
          endpoint += `&sortOrder=${sortOrder}`
        }
        if (cursorValue) {
          endpoint += `&cursor=${encodeURIComponent(cursorValue)}`
        }

        const response = await apiClient(endpoint)
        if (response.success) {
          setTransactions((prev) => (isInitial ? response.data : [...prev, ...response.data]))
          setNextCursor(response.nextCursor || null)
        } else {
          setError(response.message || "Failed to fetch transactions")
        }
      } catch (err) {
        console.error("Error fetching transactions:", err)
        setError(err instanceof Error ? err.message : "Failed to load transactions")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [bookId, selectedCategoryId, selectedType, debouncedSearchQuery, sortBy, sortOrder]
  )

  // Re-run initial fetch when search, sorting or filters change
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions(null, true)
  }, [fetchTransactions])

  // Trigger refetch of page 1 and parent stats
  const handleMutation = () => {
    fetchTransactions(null, true)
    onMutation?.()
  }

  // Load next page
  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchTransactions(nextCursor, false)
    }
  }

  // Toggle Sorting Order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  // Date formatter
  const formatTxnDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  // Currency formatter
  const formatAmount = (amountStr: string) => {
    const amountVal = parseFloat(amountStr) || 0
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amountVal)
  }

  return (
    <div className="space-y-4">
      {/* Search, Filter & Sort Controls */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Top Row: Search and Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, category or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="icon"
                onClick={handleMutation}
                disabled={loading}
                title="Refresh ledger"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <CreateTransactionDialog currentBookId={bookId} onSuccess={handleMutation} />
            </div>
          </div>

          {/* Bottom Row: Filters and Sort options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Category Filter */}
            <div>
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="none">No Category (General)</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <Select
                value={selectedType}
                onValueChange={(val) => setSelectedType(val as "all" | "credit" | "debit")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="debit">Expense (Debit)</SelectItem>
                  <SelectItem value="credit">Income (Credit)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Field Select */}
            <div>
              <Select
                value={sortBy}
                onValueChange={(val) =>
                  setSortBy(val as "createdAt" | "paidAt" | "price" | "alphabet")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="paidAt">Date Paid</SelectItem>
                  <SelectItem value="price">Amount</SelectItem>
                  <SelectItem value="alphabet">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order Direction Toggle */}
            <div className="flex">
              <Button
                variant="outline"
                onClick={toggleSortOrder}
                className="w-full flex items-center justify-between px-3"
                title={`Sort order: ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
              >
                <span className="text-sm font-normal">
                  {sortOrder === "asc" ? "Ascending" : "Descending"}
                </span>
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Ledger Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Transaction Ledger</CardTitle>
            <CardDescription>
              A record of income and expenses associated with your book.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 gap-2 text-center text-destructive">
              <AlertCircle className="h-10 w-10 text-destructive/80" />
              <h3 className="font-semibold text-lg">Error Loading Transactions</h3>
              <p className="text-sm text-muted-foreground max-w-md">{error}</p>
              <Button variant="outline" className="mt-2" onClick={() => fetchTransactions(null, true)}>
                Retry
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-t border-dashed">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-base text-foreground">No transactions found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                There are no transaction records matching your current criteria.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border border-t">
              {transactions.map((txn) => {
                const isCredit = txn.type === "credit"
                // Prefer API returned categoryName, fallback to looking it up locally
                const catName = txn.categoryName || (
                  txn.categoryId ? categories.find(c => String(c.id) === String(txn.categoryId))?.name : null
                )
                
                return (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      {/* Circle Badge Indicator */}
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                          isCredit
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>

                      {/* Transaction Details */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
                          {txn.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1" title={`Created at: ${formatTxnDate(txn.createdAt)}`}>
                            <Calendar className="h-3 w-3" />
                            Paid: {formatTxnDate(txn.paidAt)}
                          </span>
                          {catName && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                                <Tag className="h-2.5 w-2.5" />
                                {catName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            isCredit
                              ? "text-green-600 dark:text-green-400"
                              : "text-foreground"
                          }`}
                        >
                          {isCredit ? "+" : "-"}{formatAmount(txn.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                          {txn.type}
                        </p>
                      </div>

                      {/* Actions (Edit / Delete) */}
                      <div className="flex items-center gap-1">
                        <EditTransactionDialog transaction={txn} currentBookId={bookId} onSuccess={handleMutation} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setTransactionToDelete(txn)}
                          title="Delete transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Load More Button */}
          {nextCursor && !loading && (
            <div className="flex justify-center py-4 border-t">
              <Button onClick={handleLoadMore} disabled={loadingMore} variant="outline" size="sm">
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading More...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2-Phase Deletion Dialog */}
      {transactionToDelete && (
        <DeleteTransactionDialog
          transaction={transactionToDelete}
          onClose={() => setTransactionToDelete(null)}
          onSuccess={handleMutation}
        />
      )}
    </div>
  )
}
