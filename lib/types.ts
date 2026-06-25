export interface Book {
  id: string;
  name: string;
  baseAmount: number;
  totalAmount: number;
  balance?: number | string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  renewCycle?: "daily" | "weekly" | "bi-weekly" | "monthly" | "custom";
  renewDayOfWeek?: number;
  renewDayOfMonth?: number;
  customCron?: string;
  renewCron?: string;
  nextRenewAt?: string;
}

export interface Category {
  id: string;
  name: string;
  bookId: string;
  baseAmount: string;
  balance?: number | string;
  carryForward: boolean;
  createdAt: string;
  updatedAt: string;
  renewCycle?: "daily" | "weekly" | "bi-weekly" | "monthly" | "custom";
  renewDayOfWeek?: number;
  renewDayOfMonth?: number;
  customCron?: string;
  renewCron?: string;
  nextRenewAt?: string;
}

export interface Transaction {
  id: string;                // UUID v4
  name: string;              // Descriptive title
  amount: string;            // Numeric string representing amount (e.g. "120.50")
  type: "credit" | "debit";  // credit = incoming, debit = outgoing
  bookId: string;            // Parent book UUID
  categoryId: string | null; // Nullable category ID (string representation)
  categoryName: string | null; // Joined category name (returned from left-join)
  paidAt: string;            // ISO-8601 date of transaction payment
  createdAt: string;         // ISO-8601 UTC timestamp string
  updatedAt: string;         // ISO-8601 UTC timestamp string
}

export interface CreateTransactionPayload {
  name: string;
  amount: number;
  type: "credit" | "debit";
  bookId: string;
  categoryId?: number | string | null;
  createdAt?: string; // Optional custom ISO-8601 datetime string
  paidAt?: string;    // Optional custom ISO-8601 datetime string
}

export interface UpdateTransactionPayload {
  name?: string;
  amount?: number;
  type?: "credit" | "debit";
  bookId?: string;
  categoryId?: number | string | null;
  createdAt?: string; // Optional custom ISO-8601 datetime string
  paidAt?: string;    // Optional custom ISO-8601 datetime string
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

