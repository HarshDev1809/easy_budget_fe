export interface Book {
  id: string;
  name: string;
  baseAmount: number;
  totalAmount: number;
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
