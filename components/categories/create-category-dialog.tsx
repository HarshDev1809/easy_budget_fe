"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, Resolver } from "react-hook-form"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { apiClient } from "@/lib/api-client"

function clampDaysOfMonthString(value: string): string {
  const sanitized = value.replace(/[^0-9,\s]/g, "");
  const parts = sanitized.split(",");
  const clampedParts = parts.map((part, index) => {
    if (part.trim() === "" && index === parts.length - 1) {
      return part;
    }
    const trimmed = part.trim();
    if (trimmed === "") return "";
    const num = parseInt(trimmed, 10);
    if (!isNaN(num)) {
      if (num > 31) return "31";
      if (num < 1) return "1";
      return num.toString();
    }
    return "";
  });
  return clampedParts.join(",");
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bookId: z.string().uuid("Invalid book ID"),
  baseAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount (e.g. 10.00)"),
  carryForward: z.boolean().default(false),
  renewCycle: z.enum(["daily", "weekly", "bi-weekly", "monthly", "custom"]),
  renewDayOfWeek: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, "Must be between 0 and 6").max(6, "Must be between 0 and 6").optional()
  ),
  renewDayOfMonth: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(1, "Must be between 1 and 31").max(31, "Must be between 1 and 31").optional()
  ),
  
  // Custom time/days UI fields
  customType: z.enum(["month", "week"]).optional(),
  customTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format").optional(),
  customDaysOfMonth: z.string().optional(),
  customDaysOfWeek: z.array(z.number().min(0).max(6)).optional(),
}).refine((data) => {
  if (data.renewCycle === "weekly" || data.renewCycle === "bi-weekly") {
    return data.renewDayOfWeek !== undefined && !isNaN(data.renewDayOfWeek);
  }
  return true;
}, {
  message: "Day of week is required for weekly/bi-weekly cycles",
  path: ["renewDayOfWeek"],
}).refine((data) => {
  if (data.renewCycle === "monthly") {
    return data.renewDayOfMonth !== undefined && !isNaN(data.renewDayOfMonth);
  }
  return true;
}, {
  message: "Day of month is required for monthly cycles",
  path: ["renewDayOfMonth"],
}).refine((data) => {
  if (data.renewCycle === "custom") {
    if (data.customType === "month") {
      if (!data.customDaysOfMonth || data.customDaysOfMonth.trim() === "") return false;
      const days = data.customDaysOfMonth.split(",").map(d => d.trim());
      return days.every(d => {
        const num = Number(d);
        return !isNaN(num) && num >= 1 && num <= 31;
      });
    } else if (data.customType === "week") {
      return !!data.customDaysOfWeek && data.customDaysOfWeek.length > 0;
    }
  }
  return true;
}, {
  message: "Day of month must be between 1 and 31 separated by commas",
  path: ["customDaysOfMonth"],
})

type FormValues = z.infer<typeof formSchema>

interface CreateCategoryDialogProps {
  bookId: string
  onSuccess?: () => void
}

export function CreateCategoryDialog({ bookId, onSuccess }: CreateCategoryDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      bookId: bookId,
      baseAmount: "0",
      carryForward: false,
      renewCycle: "monthly",
      renewDayOfWeek: 1,
      renewDayOfMonth: 1,
      customType: "month",
      customTime: "00:00",
      customDaysOfMonth: "1",
      customDaysOfWeek: [1],
    },
  })

  // Update bookId if it changes
  React.useEffect(() => {
    form.setValue("bookId", bookId)
  }, [bookId, form])

  const renewCycle = form.watch("renewCycle")
  const customType = form.watch("customType")

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        bookId: values.bookId,
        baseAmount: values.baseAmount,
        carryForward: values.carryForward,
        renewCycle: values.renewCycle,
      }

      if (values.renewCycle === "weekly" || values.renewCycle === "bi-weekly") {
        payload.renewDayOfWeek = values.renewDayOfWeek
      } else if (values.renewCycle === "monthly") {
        payload.renewDayOfMonth = values.renewDayOfMonth
      } else if (values.renewCycle === "custom") {
        const [hour, minute] = (values.customTime || "00:00").split(":").map(Number)
        if (values.customType === "month") {
          const cleanDom = (values.customDaysOfMonth || "1").split(",").map(d => d.trim()).join(",")
          payload.customCron = `${minute} ${hour} ${cleanDom} * *`
        } else {
          const cleanDow = values.customDaysOfWeek && values.customDaysOfWeek.length > 0 
            ? values.customDaysOfWeek.join(",") 
            : "*"
          payload.customCron = `${minute} ${hour} * * ${cleanDow}`
        }
      }

      await apiClient("/api/v1/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      toast.success("Category created successfully")
      setOpen(false)
      form.reset({
        name: "",
        bookId: bookId,
        baseAmount: "0",
        carryForward: false,
        renewCycle: "monthly",
        renewDayOfWeek: 1,
        renewDayOfMonth: 1,
        customType: "month",
        customTime: "00:00",
        customDaysOfMonth: "1",
        customDaysOfWeek: [1],
      })
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create category")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>
            Add a new category to this book for budgeting.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="name">Category Name</FieldLabel>
            <Input
              id="name"
              placeholder="e.g. Groceries"
              {...form.register("name")}
              aria-invalid={!!form.formState.errors.name}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          
          <Field>
            <FieldLabel htmlFor="baseAmount">Base Amount</FieldLabel>
            <Input
              id="baseAmount"
              placeholder="0.00"
              {...form.register("baseAmount")}
              aria-invalid={!!form.formState.errors.baseAmount}
            />
            <FieldError errors={[form.formState.errors.baseAmount]} />
          </Field>

          <div className="flex items-center space-x-2 py-2">
            <Checkbox 
              id="carryForward" 
              checked={form.watch("carryForward")}
              onCheckedChange={(checked) => form.setValue("carryForward", checked === true)}
            />
            <label
              htmlFor="carryForward"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Carry Forward
            </label>
          </div>

          <Field>
            <FieldLabel htmlFor="renewCycle">Renew Cycle</FieldLabel>
            <Controller
              name="renewCycle"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="renewCycle" className="w-full">
                    <SelectValue placeholder="Select cycle" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[form.formState.errors.renewCycle]} />
          </Field>

          {(renewCycle === "weekly" || renewCycle === "bi-weekly") && (
            <Field>
              <FieldLabel htmlFor="renewDayOfWeek">Renew Day of Week</FieldLabel>
              <Controller
                name="renewDayOfWeek"
                control={form.control}
                render={({ field }) => (
                  <Select 
                    onValueChange={(val) => field.onChange(parseInt(val, 10))} 
                    value={field.value?.toString() ?? "1"}
                  >
                    <SelectTrigger id="renewDayOfWeek" className="w-full">
                      <SelectValue placeholder="Select day of week" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[form.formState.errors.renewDayOfWeek]} />
            </Field>
          )}

          {renewCycle === "monthly" && (
            <Field>
              <FieldLabel htmlFor="renewDayOfMonth">Renew Day of Month</FieldLabel>
              <Input
                id="renewDayOfMonth"
                type="number"
                min={1}
                max={31}
                placeholder="e.g. 1"
                {...form.register("renewDayOfMonth", {
                  valueAsNumber: true,
                  onChange: (e) => {
                    const rawVal = e.target.value;
                    if (rawVal === "") {
                      form.setValue("renewDayOfMonth", undefined);
                      return;
                    }
                    const val = parseInt(rawVal, 10);
                    if (!isNaN(val)) {
                      const clamped = Math.max(1, Math.min(31, val));
                      form.setValue("renewDayOfMonth", clamped);
                    }
                  }
                })}
                aria-invalid={!!form.formState.errors.renewDayOfMonth}
              />
              <FieldError errors={[form.formState.errors.renewDayOfMonth]} />
            </Field>
          )}

          {renewCycle === "custom" && (
            <div className="space-y-4 border p-3 rounded-md bg-muted/10">
              <Field>
                <FieldLabel htmlFor="customType">Custom Schedule Type</FieldLabel>
                <Controller
                  name="customType"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="customType" className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="month">Specific Days of Month</SelectItem>
                        <SelectItem value="week">Specific Days of Week</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="customTime">Reset Time (HH:MM)</FieldLabel>
                <Input
                  id="customTime"
                  type="time"
                  {...form.register("customTime")}
                  aria-invalid={!!form.formState.errors.customTime}
                />
                <FieldError errors={[form.formState.errors.customTime]} />
              </Field>

              {customType === "month" ? (
                <Field>
                  <FieldLabel htmlFor="customDaysOfMonth">Days of the Month</FieldLabel>
                  <Input
                    id="customDaysOfMonth"
                    placeholder="e.g. 1, 15, 30"
                    {...form.register("customDaysOfMonth", {
                      onChange: (e) => {
                        const clamped = clampDaysOfMonthString(e.target.value);
                        form.setValue("customDaysOfMonth", clamped);
                      }
                    })}
                    aria-invalid={!!form.formState.errors.customDaysOfMonth}
                  />
                  <FieldDescription>
                    Enter day numbers between 1 and 31, separated by commas.
                  </FieldDescription>
                  <FieldError errors={[form.formState.errors.customDaysOfMonth]} />
                </Field>
              ) : (
                <Field>
                  <FieldLabel>Days of the Week</FieldLabel>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => {
                      const currentSelected = form.watch("customDaysOfWeek") || [];
                      const isChecked = currentSelected.includes(index);
                      return (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${index}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked === true) {
                                form.setValue("customDaysOfWeek", [...currentSelected, index]);
                              } else {
                                form.setValue("customDaysOfWeek", currentSelected.filter(d => d !== index));
                              }
                            }}
                          />
                          <label htmlFor={`day-${index}`} className="text-sm font-medium leading-none cursor-pointer">
                            {day}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <FieldError errors={[form.formState.errors.customDaysOfWeek]} />
                </Field>
              )}
            </div>
          )}
          
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
              {isSubmitting ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
