"use client"

import * as React from "react"
import { Book as BookIcon, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateBookDialog } from "@/components/books/create-book-dialog"
import { apiClient } from "@/lib/api-client"
import { Book, ApiResponse } from "@/lib/types"

import Link from "next/link"

export default function BooksPage() {
  const [books, setBooks] = React.useState<Book[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString))
  }

  const fetchBooks = React.useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      setError(null)
      const response: ApiResponse<Book[]> = await apiClient("/api/v1/books")
      if (response.success) {
        setBooks(response.data)
      } else {
        setError(response.message || "Failed to fetch books")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching books")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBooks()
  }, [fetchBooks])

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Books</h1>
          <p className="text-muted-foreground text-lg">Manage your financial books and records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => fetchBooks(true)} 
            disabled={loading}
            title="Refresh books"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <CreateBookDialog onSuccess={() => fetchBooks(false)} />
        </div>
      </header>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => fetchBooks(true)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : books.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <Link key={book.id} href={`/${book.id}`} className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <Card className="h-full cursor-pointer hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{book.name}</CardTitle>
                  <BookIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(book.baseAmount)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated {formatDate(book.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
          <Card className="min-h-[120px] flex items-center justify-center border-dashed">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-sm">Have more records?</p>
              <Button variant="ghost" size="sm">Import data</Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="min-h-[300px] flex flex-col items-center justify-center border-dashed">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <BookIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground font-medium">No books found.</p>
              <p className="text-sm text-muted-foreground">Create your first book to start tracking your finances.</p>
            </div>
            <div className="flex gap-2 justify-center">
               <Button 
                variant="outline" 
                size="icon" 
                onClick={() => fetchBooks(true)} 
                disabled={loading}
                title="Refresh books"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
               <CreateBookDialog onSuccess={() => fetchBooks(false)} />
               <Button variant="outline">Import data</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
