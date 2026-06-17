export interface Book {
  id: string;
  name: string;
  baseAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
