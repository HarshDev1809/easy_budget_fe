"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { Trash2, Loader2, KeyRound, ListTodo, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Category, Book, ApiResponse } from "@/lib/types"
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog"
import { EditCategoryDialog } from "@/components/categories/edit-category-dialog"
import { EditBookDialog } from "@/components/books/edit-book-dialog"
import { formatCategoryRenewCycle, formatCategoryNextReset } from "@/lib/utils"
import { toast } from "sonner"
import { TransactionList } from "@/components/transactions/transaction-list"


export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.bookId as string

  const [categories, setCategories] = React.useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = React.useState(true)
  const [book, setBook] = React.useState<Book | null>(null)
  const [bookLoading, setBookLoading] = React.useState(true)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showCodeDialog, setShowCodeDialog] = React.useState(false)
  const [code, setCode] = React.useState("")
  const [codeLoading, setCodeLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<string | null>(null)
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null)

  const [receivedCode, setReceivedCode] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<"transactions" | "categories" | "danger">("transactions")


  const fetchBookDetails = React.useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setBookLoading(true)
      }
      const response: ApiResponse<Book[]> = await apiClient("/api/v1/books")
      if (response.success) {
        const foundBook = response.data.find((b) => b.id === bookId)
        if (foundBook) {
          setBook(foundBook)
        } else {
          toast.error("Book not found")
          router.push("/books")
        }
      } else {
        toast.error("Failed to fetch book details")
      }
    } catch (err) {
      console.error("Failed to fetch book details:", err)
      toast.error("Failed to load book details")
    } finally {
      setBookLoading(false)
    }
  }, [bookId, router])

  const fetchCategories = React.useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setCategoriesLoading(true)
      }
      const response = await apiClient(`/api/v1/categories/${bookId}`)
      if (response.success) {
        setCategories(response.data)
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err)
      toast.error("Failed to load categories")
    } finally {
      setCategoriesLoading(false)
    }
  }, [bookId])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookDetails()
    fetchCategories()
  }, [fetchBookDetails, fetchCategories])

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      setDeletingCategoryId(categoryToDelete.id)
      const response = await apiClient(`/api/v1/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      })
      if (response.success) {
        toast.success("Category deleted")
        setCategoryToDelete(null)
        fetchCategories()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category")
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const handleDeleteRequest = async () => {
    try {
      setIsDeleting(true)
      setError(null)
      const response = await apiClient(`/api/v1/books/${bookId}/delete-request`, {
        method: "POST",
      })
      
      if (response.success) {
        // API returns { otp: "..." }
        setReceivedCode(response.data.otp)
        setShowCodeDialog(true)
      } else {
        setError(response.message || "Failed to initiate delete request")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFinalDelete = async () => {
    if (!code) return

    try {
      setCodeLoading(true)
      setError(null)
      const response = await apiClient(`/api/v1/books/${bookId}`, {
        method: "DELETE",
        body: JSON.stringify({ otp: code }), // API expects { otp: "..." }
      })

      if (response.success) {
        router.push("/books")
      } else {
        setError(response.message || "Failed to delete book")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during deletion")
    } finally {
      setCodeLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-10 px-4">
      {bookLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : book && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                {book.name}
              </CardTitle>
              <CardDescription className="text-base font-semibold text-foreground flex flex-wrap gap-x-4">
                <span>Base Amount: {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(book.baseAmount)}</span>
                {book.balance !== undefined && (
                  <span className="text-primary font-bold">
                    Balance: {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(typeof book.balance === 'string' ? parseFloat(book.balance) : book.balance)}
                  </span>
                )}
              </CardDescription>

            </div>
            <EditBookDialog book={book} onSuccess={fetchBookDetails} />
          </CardHeader>
        </Card>
      )}

      <div className="flex border-b border-border my-2">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "transactions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "categories"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab("danger")}
          className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "danger"
              ? "border-destructive text-destructive"
              : "border-transparent text-muted-foreground hover:text-destructive"
          }`}
        >
          Danger Zone
        </button>
      </div>

      {activeTab === "transactions" && (
        <TransactionList
          bookId={bookId}
          categories={categories}
          onMutation={() => {
            fetchBookDetails()
            fetchCategories()
          }}
        />
      )}

      {activeTab === "categories" && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Categories
              </CardTitle>
              <CardDescription>
                Manage budget categories for this book.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchCategories(true)}
                disabled={categoriesLoading}
                title="Refresh categories"
              >
                <RefreshCw className={`h-4 w-4 ${categoriesLoading ? "animate-spin" : ""}`} />
              </Button>
              <CreateCategoryDialog bookId={bookId} onSuccess={fetchCategories} />
            </div>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">No categories yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 font-semibold text-muted-foreground">Category Name</th>
                      <th className="py-3 px-4 font-semibold text-muted-foreground">Base Amount</th>
                      <th className="py-3 px-4 font-semibold text-muted-foreground">Balance</th>
                      <th className="py-3 px-4 font-semibold text-muted-foreground">Carry Forward</th>
                      <th className="py-3 px-4 font-semibold text-muted-foreground">Renewal Cycle</th>
                      <th className="py-3 px-4 font-semibold text-muted-foreground">Next Reset</th>
                      <th className="py-3 px-4 font-semibold text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium">{category.name}</td>
                        <td className="py-3 px-4">₹{category.baseAmount}</td>
                        <td className="py-3 px-4 font-semibold text-primary">
                          {category.balance !== undefined ? `₹${category.balance}` : "-"}
                        </td>
                        <td className="py-3 px-4">
                          {category.carryForward ? (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                              Yes
                            </span>
                          ) : (
                            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                              No
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{formatCategoryRenewCycle(category)}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {category.nextRenewAt ? formatCategoryNextReset(category.nextRenewAt) : "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <EditCategoryDialog category={category} onSuccess={fetchCategories} />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setCategoryToDelete(category)}
                              disabled={deletingCategoryId === category.id}
                              title="Delete category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}  )}

      {/* Category Deletion Confirmation Dialog */}
      <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category &quot;{categoryToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryToDelete(null)} disabled={!!deletingCategoryId}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCategory}
              disabled={!!deletingCategoryId}
            >
              {deletingCategoryId ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeTab === "danger" && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Manage sensitive actions for this book.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-destructive/5">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Delete this book</h3>
                <p className="text-sm text-muted-foreground">
                  Once deleted, all records in this book will be permanently removed.
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleDeleteRequest}
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Book
              </Button>
            </div>
            
            {error && !showCodeDialog && (
              <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              A deletion request has been initiated. Please enter the verification code to confirm.
              {receivedCode && (
                <span className="block mt-4 p-3 bg-muted rounded-md font-mono text-2xl font-bold text-center tracking-[0.5em] text-primary border border-primary/20">
                  {receivedCode}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Enter Code</Label>
              <Input
                id="code"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
              />
            </div>
            {error && showCodeDialog && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleFinalDelete}
              disabled={codeLoading || !code}
            >
              {codeLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
