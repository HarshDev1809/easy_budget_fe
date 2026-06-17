"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Plus } from "lucide-react"

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
import { apiClient } from "@/lib/api-client"

const formSchema = z.object({
  name: z.string().min(1, "Book name is required"),
  baseAmount: z.coerce.number({
    message: "Base amount must be a number",
  }).finite("Base amount must be a valid number"),
})

type FormValues = z.infer<typeof formSchema>

interface CreateBookDialogProps {
  onSuccess?: () => void
}

export function CreateBookDialog({ onSuccess }: CreateBookDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      baseAmount: 0,
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      await apiClient("/api/v1/books", {
        method: "POST",
        body: JSON.stringify(values),
      })
      toast.success("Book created successfully")
      setOpen(false)
      form.reset()
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create book")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Book
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Book</DialogTitle>
          <DialogDescription>
            Add a new book to track your expenses and income.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="name">Book Name</FieldLabel>
            <Input
              id="name"
              placeholder="e.g. Monthly Expenses"
              {...form.register("name")}
              aria-invalid={!!form.formState.errors.name}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="baseAmount">Base Amount</FieldLabel>
            <Input
              id="baseAmount"
              type="number"
              step="any"
              placeholder="0.00"
              {...form.register("baseAmount", { valueAsNumber: true })}
              aria-invalid={!!form.formState.errors.baseAmount}
            />
            <FieldError errors={[form.formState.errors.baseAmount]} />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
