"use client"

import * as React from "react"
import { Trash2, Loader2, KeyRound } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { apiClient } from "@/lib/api-client"
import { Transaction } from "@/lib/types"

interface DeleteTransactionDialogProps {
  transaction: Transaction | null
  onClose: () => void
  onSuccess?: () => void
}

export function DeleteTransactionDialog({
  transaction,
  onClose,
  onSuccess,
}: DeleteTransactionDialogProps) {
  const [token, setToken] = React.useState<string | null>(null)
  const [typedToken, setTypedToken] = React.useState("")
  const [loadingToken, setLoadingToken] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [timeLeft, setTimeLeft] = React.useState(300) // 5 minutes in seconds
  const [error, setError] = React.useState<string | null>(null)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Start the 5-minute countdown timer
  const startTimer = React.useCallback(() => {
    setTimeLeft(300)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  // Clear timer on unmount or close
  const clearTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Trigger Phase 1: Request Deletion Token
  const requestDeletionToken = React.useCallback(async (txnId: string) => {
    setLoadingToken(true)
    setError(null)
    setToken(null)
    setTypedToken("")
    try {
      const response = await apiClient(`/api/v1/transactions/${txnId}/delete-request`, {
        method: "POST",
      })

      if (response.success && response.data?.token) {
        setToken(response.data.token)
        startTimer()
      } else {
        setError(response.message || "Failed to generate verification token.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate deletion token")
    } finally {
      setLoadingToken(false)
    }
  }, [startTimer])

  React.useEffect(() => {
    if (transaction) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      requestDeletionToken(transaction.id)
    } else {
      clearTimer()
      setToken(null)
      setTypedToken("")
      setError(null)
    }

    return () => clearTimer()
  }, [transaction, requestDeletionToken, clearTimer])

  // Trigger Phase 2: Confirm Deletion
  const handleConfirmDelete = async () => {
    if (!transaction || !token) return
    if (timeLeft <= 0) {
      toast.error("Deletion token has expired. Please request a new one.")
      return
    }
    if (typedToken !== token) {
      toast.error("Verification code does not match.")
      return
    }

    setDeleting(true)
    setError(null)
    try {
      const response = await apiClient(`/api/v1/transactions/${transaction.id}`, {
        method: "DELETE",
        body: JSON.stringify({ token: typedToken }),
      })

      if (response.success) {
        toast.success("Transaction deleted successfully.")
        onClose()
        onSuccess?.()
      } else {
        setError(response.message || "Failed to delete transaction.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete transaction")
    } finally {
      setDeleting(false)
    }
  }

  // Helper to format remaining time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const isTimerExpired = timeLeft <= 0
  const isMatch = typedToken === token
  const isSubmitDisabled = deleting || loadingToken || isTimerExpired || !isMatch

  return (
    <Dialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <KeyRound className="h-5 w-5" />
            Verify Deletion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the transaction &quot;{transaction?.name}&quot;?
            This action is permanent and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {loadingToken ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Requesting verification token...</p>
          </div>
        ) : error ? (
          <div className="py-4">
            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md border border-destructive/20 mb-4">
              {error}
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => transaction && requestDeletionToken(transaction.id)}
            >
              Retry Token Request
            </Button>
          </div>
        ) : (
          token && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                  Verification Token (Case Sensitive)
                </span>
                <span className="p-3 bg-muted rounded-md font-mono text-3xl font-extrabold text-center tracking-[0.4em] text-primary border border-primary/20 select-all">
                  {token}
                </span>
                <span className={`text-sm font-semibold mt-1 ${isTimerExpired ? "text-destructive" : "text-muted-foreground"}`}>
                  {isTimerExpired ? (
                    "Token expired"
                  ) : (
                    `Expires in ${formatTime(timeLeft)}`
                  )}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-token-input">Type verification token to confirm</Label>
                <Input
                  id="delete-token-input"
                  placeholder="Enter exact token"
                  value={typedToken}
                  onChange={(e) => setTypedToken(e.target.value)}
                  disabled={isTimerExpired || deleting}
                  autoComplete="off"
                  className="font-mono text-center text-lg uppercase tracking-wider"
                  autoFocus
                />
              </div>

              {isTimerExpired && (
                <p className="text-sm text-destructive font-medium text-center">
                  This token has expired. Please close this window and try again.
                </p>
              )}
            </div>
          )
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isSubmitDisabled}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Confirm Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
