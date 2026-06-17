"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { Trash2, Loader2, KeyRound } from "lucide-react"
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

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.bookId as string

  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showCodeDialog, setShowCodeDialog] = React.useState(false)
  const [code, setCode] = React.useState("")
  const [codeLoading, setCodeLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [receivedCode, setReceivedCode] = React.useState<string | null>(null)

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
    <div className="max-w-2xl mx-auto space-y-6 py-10">
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
