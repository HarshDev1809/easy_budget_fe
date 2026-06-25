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
import { Transaction, Category, ApiResponse } from "@/lib/types"
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
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Filters state
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("all")
  const [selectedType, setSelectedType] = React.useState<"all" | "credit" | "debit">("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  // Deletion modal state
  const [transactionToDelete, setTransactionToDelete] = React.useState<Transaction | null>(null)

  // Fetch transactions from API
  const fetchTransactions = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let endpoint = `/api/v1/transactions?bookId=${bookId}`
      if (selectedCategoryId && selectedCategoryId !== "all") {
        // Handle categories
        endpoint += `&categoryId=${selectedCategoryId === "none" ? "null" : selectedCategoryId}`
      }
      
      const response: ApiResponse<Transaction[]> = await apiClient(endpoint)
      if (response.success) {
        setTransactions(response.data)
      } else {
        setError(response.message || "Failed to fetch transactions")
      }
    } catch (err) {
      console.error("Error fetching transactions:", err)
      setError(err instanceof Error ? err.message : "Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }, [bookId, selectedCategoryId])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions()
  }, [fetchTransactions])

  // Triggered when a transaction is Created, Updated, or Deleted
  const handleMutation = () => {
    fetchTransactions()
    onMutation?.()
  }

  // Filter transactions on client for search query and type filter
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch = txn.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = selectedType === "all" || txn.type === selectedType
      return matchesSearch && matchesType
    })
  }, [transactions, searchQuery, selectedType])

  // Format dates
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

  // Format currency
  const formatAmount = (amountStr: string) => {
    const amountVal = parseFloat(amountStr) || 0
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amountVal)
  }

  // Helper to find category name by categoryId
  const getCategoryName = (catId: string | null) => {
    if (!catId) return null
    const found = categories.find((c) => c.id === catId || c.id === String(catId))
    return found ? found.name : "Category"
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Controls */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-[200px]">
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category Filter" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="none">No Category (General)</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="w-full sm:w-[150px]">
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
          </div>

          <div className="flex items-center justify-end">
            <CreateTransactionDialog currentBookId={bookId} onSuccess={handleMutation} />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Ledger */}
      <Card>
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Transaction Ledger</CardTitle>
            <CardDescription>
              A record of income and expenses associated with this book.
            </CardDescription>
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            Showing {filteredTransactions.length} of {transactions.length} transactions
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
              <Button variant="outline" className="mt-2" onClick={fetchTransactions}>
                Retry
              </Button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-t border-dashed">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-base text-foreground">No transactions found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                {transactions.length === 0
                  ? "There are no transactions recorded in this book yet."
                  : "No transactions match your current filters and search query."}
              </p>
              {transactions.length === 0 && (
                <div className="mt-4">
                  <CreateTransactionDialog currentBookId={bookId} onSuccess={handleMutation} />
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border border-t">
              {filteredTransactions.map((txn) => {
                const catName = getCategoryName(txn.categoryId)
                const isCredit = txn.type === "credit"
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

                      {/* Transaction details */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
                          {txn.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatTxnDate(txn.createdAt)}
                          </span>
                          {catName && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-medium font-semibold uppercase tracking-wider">
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

                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-1">
                        <EditTransactionDialog transaction={txn} onSuccess={handleMutation} />
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
        </CardContent>
      </Card>

      {/* 2-Phase Deletion Flow confirmation dialog */}
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
