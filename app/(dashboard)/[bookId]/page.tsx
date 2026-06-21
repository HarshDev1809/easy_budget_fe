"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { Trash2, Loader2, KeyRound, ListTodo } from "lucide-react"
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
              <CardDescription className="text-base font-semibold text-foreground">
                Base Amount: {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(book.baseAmount)}
              </CardDescription>
            </div>
            <EditBookDialog book={book} onSuccess={fetchBookDetails} />
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Categories
            </CardTitle>
            <CardDescription>
              Manage budget categories for this book.
            </CardDescription>
          </div>
          <CreateCategoryDialog bookId={bookId} onSuccess={fetchCategories} />
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.id} className="relative group overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base truncate">{category.name}</CardTitle>
                    <CardDescription className="flex flex-col gap-1.5 pt-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Base: ₹{category.baseAmount}</span>
                        {category.carryForward && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
                            Carry
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground space-y-0.5 pt-1">
                        <p>{formatCategoryRenewCycle(category)}</p>
                        {category.nextRenewAt && (
                          <p>{formatCategoryNextReset(category.nextRenewAt)}</p>
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <EditCategoryDialog category={category} onSuccess={fetchCategories} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setCategoryToDelete(category)}
                      disabled={deletingCategoryId === category.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            Manage sensitive actions for this book.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-destructive/5">
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
