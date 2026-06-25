"use client"

import * as React from "react"
import { useForm, Controller, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import { Book, Category, ApiResponse } from "@/lib/types"

const formatToLocalDatetime = (date: Date) => {
  const pad = (num: number) => String(num).padStart(2, "0")
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce
    .number({
      message: "Amount must be a number",
    })
    .positive("Amount must be a positive number"),
  type: z.enum(["credit", "debit"]),
  bookId: z.string().min(1, "Book is required"),
  categoryId: z.union([z.string(), z.number()]).nullable().optional(),
  createdAt: z.string().optional().or(z.literal("")),
  paidAt: z.string().optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

interface CreateTransactionDialogProps {
  currentBookId?: string
  onSuccess?: () => void
}

export function CreateTransactionDialog({
  currentBookId,
  onSuccess,
}: CreateTransactionDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [books, setBooks] = React.useState<Book[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [booksLoading, setBooksLoading] = React.useState(false)
  const [categoriesLoading, setCategoriesLoading] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      amount: 0,
      type: "debit",
      bookId: currentBookId || "",
      categoryId: null,
      createdAt: formatToLocalDatetime(new Date()),
      paidAt: formatToLocalDatetime(new Date()),
    },
  })

  const selectedBookId = form.watch("bookId")

  // Fetch all books for the book selection dropdown
  const fetchBooks = React.useCallback(async () => {
    setBooksLoading(true)
    try {
      const response: ApiResponse<Book[]> = await apiClient("/api/v1/books")
      if (response.success) {
        setBooks(response.data)
      }
    } catch (err) {
      console.error("Failed to fetch books for selector:", err)
      toast.error("Failed to load books")
    } finally {
      setBooksLoading(false)
    }
  }, [])

  // Fetch categories for the currently selected book
  const fetchCategories = React.useCallback(async (bookId: string) => {
    if (!bookId) {
      setCategories([])
      return
    }
    setCategoriesLoading(true)
    try {
      const response: ApiResponse<Category[]> = await apiClient(
        `/api/v1/categories/${bookId}`
      )
      if (response.success) {
        setCategories(response.data)
      }
    } catch (err) {
      console.error(`Failed to fetch categories for book ${bookId}:`, err)
      toast.error("Failed to load categories")
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      fetchBooks()
    }
  }, [open, fetchBooks])

  React.useEffect(() => {
    if (selectedBookId) {
      fetchCategories(selectedBookId)
      // Reset category selection when parent book changes
      form.setValue("categoryId", null)
    } else {
      setCategories([])
      form.setValue("categoryId", null)
    }
  }, [selectedBookId, fetchCategories, form])

  // Handle open state reset
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        amount: 0,
        type: "debit",
        bookId: currentBookId || "",
        categoryId: null,
        createdAt: formatToLocalDatetime(new Date()),
        paidAt: formatToLocalDatetime(new Date()),
      })
    }
  }, [open, currentBookId, form])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const payload = {
        name: values.name,
        amount: values.amount,
        type: values.type,
        bookId: values.bookId,
        categoryId: values.categoryId === "none" || !values.categoryId ? null : values.categoryId,
        createdAt: values.createdAt ? new Date(values.createdAt).toISOString() : new Date().toISOString(),
        paidAt: values.paidAt ? new Date(values.paidAt).toISOString() : new Date().toISOString(),
      }

      await apiClient("/api/v1/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      toast.success("Transaction created successfully")
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a new transaction to track income (credit) or expense (debit).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              placeholder="e.g. Grocery Shop"
              {...form.register("name")}
              aria-invalid={!!form.formState.errors.name}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="amount">Amount</FieldLabel>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register("amount")}
                aria-invalid={!!form.formState.errors.amount}
              />
              <FieldError errors={[form.formState.errors.amount]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="type">Type</FieldLabel>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="debit">Debit (Expense)</SelectItem>
                      <SelectItem value="credit">Credit (Income)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[form.formState.errors.type]} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="paidAt">Date Paid (Paid At)</FieldLabel>
              <Input
                id="paidAt"
                type="datetime-local"
                {...form.register("paidAt")}
                aria-invalid={!!form.formState.errors.paidAt}
              />
              <FieldError errors={[form.formState.errors.paidAt]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="createdAt">Date Created (Created At)</FieldLabel>
              <Input
                id="createdAt"
                type="datetime-local"
                {...form.register("createdAt")}
                aria-invalid={!!form.formState.errors.createdAt}
              />
              <FieldError errors={[form.formState.errors.createdAt]} />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="bookId">Parent Book</FieldLabel>
            <Controller
              name="bookId"
              control={form.control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={booksLoading}
                >
                  <SelectTrigger id="bookId" className="w-full">
                    <SelectValue placeholder={booksLoading ? "Loading books..." : "Select Book"} />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {books.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[form.formState.errors.bookId]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="categoryId">Category (Optional)</FieldLabel>
            <Controller
              name="categoryId"
              control={form.control}
              render={({ field }) => (
                <Select
                  onValueChange={(val) => {
                    if (val === "none") {
                      field.onChange(null)
                    } else {
                      const numericVal = Number(val)
                      const hasNumericId = categories.some(
                        (c) => typeof c.id === "number" && Number(c.id) === numericVal
                      )
                      field.onChange(hasNumericId ? numericVal : val)
                    }
                  }}
                  value={field.value ? String(field.value) : "none"}
                  disabled={categoriesLoading || !selectedBookId}
                >
                  <SelectTrigger id="categoryId" className="w-full">
                    <SelectValue
                      placeholder={
                        categoriesLoading
                          ? "Loading categories..."
                          : !selectedBookId
                          ? "Select a book first"
                          : "Select Category"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="none">No Category (General)</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[form.formState.errors.categoryId]} />
          </Field>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Transaction"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
