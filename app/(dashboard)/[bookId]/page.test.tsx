import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BookDetailPage from "./page";
import { apiClient } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

// Mock dependencies
vi.mock("@/lib/api-client", () => ({
  apiClient: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/transactions/transaction-list", () => ({
  TransactionList: () => <div data-testid="mock-transaction-list">Mock Transaction List</div>,
}));

vi.mock("@/components/categories/create-category-dialog", () => ({
  CreateCategoryDialog: () => <div data-testid="create-category-dialog">Create Category Dialog</div>,
}));

vi.mock("@/components/categories/edit-category-dialog", () => ({
  EditCategoryDialog: () => <div data-testid="edit-category-dialog">Edit Category Dialog</div>,
}));

vi.mock("@/components/books/edit-book-dialog", () => ({
  EditBookDialog: () => <div data-testid="edit-book-dialog">Edit Book Dialog</div>,
}));

// Mock Dialog primitive to render inline without Radix portal/focus trap in test environment
vi.mock("@/components/ui/dialog", () => {
  return {
    Dialog: ({ children, open }: any) => (open ? <div data-testid="mock-dialog">{children}</div> : null),
    DialogContent: ({ children }: any) => <div data-testid="mock-dialog-content">{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogTrigger: ({ children }: any) => <>{children}</>,
  };
});

describe("BookDetailPage", () => {
  const mockRouter = useRouter();
  const mockParams = { bookId: "book-123" };

  const mockBookData = {
    id: "book-123",
    name: "Holiday Budget",
    baseAmount: 50000,
    balance: 45000,
    createdAt: "2026-06-25T12:00:00Z",
    updatedAt: "2026-06-26T12:00:00Z",
  };

  const mockCategoriesData = [
    {
      id: "cat-1",
      name: "Food & Drinks",
      baseAmount: 15000,
      balance: 12000,
      renewCycle: "monthly",
      renewDayOfMonth: 1,
      carryForward: true,
      nextRenewAt: "2026-07-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useParams).mockReturnValue(mockParams);

    // Setup robust URL-based mock implementation to prevent concurrent fetch race conditions
    vi.mocked(apiClient).mockImplementation(async (url, options) => {
      if (url === "/api/v1/books") {
        return { success: true, data: [mockBookData] };
      }
      if (url === "/api/v1/categories/book-123") {
        return { success: true, data: mockCategoriesData };
      }
      if (url === "/api/v1/books/book-123/delete-request") {
        return { success: true, data: { otp: "998877" } };
      }
      if (url === "/api/v1/books/book-123" && options?.method === "DELETE") {
        return { success: true };
      }
      if (url === "/api/v1/categories/cat-1" && options?.method === "DELETE") {
        return { success: true };
      }
      return { success: true };
    });
  });

  it("renders loader initially, then details and transactions tab content", async () => {
    const { container } = render(<BookDetailPage />);

    expect(container.querySelector(".animate-spin")).toBeInTheDocument();

    await waitFor(() => {
      expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Holiday Budget")).toBeInTheDocument();
    expect(screen.getByTestId("mock-transaction-list")).toBeInTheDocument();
  });

  it("switches tabs and displays categories and can delete a category", async () => {
    const { container } = render(<BookDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Holiday Budget")).toBeInTheDocument();
    });

    // Click Categories Tab
    const categoriesTab = screen.getByRole("button", { name: "Categories" });
    fireEvent.click(categoriesTab);

    expect(screen.getByText("Food & Drinks")).toBeInTheDocument();
    expect(screen.getByText("Base: ₹15000")).toBeInTheDocument();
    expect(screen.getByText("Balance: ₹12000")).toBeInTheDocument();
    expect(screen.getByTestId("create-category-dialog")).toBeInTheDocument();

    // Query for category delete button specifically by locating the trash icon parent
    const trashIcon = container.querySelector(".lucide-trash-2");
    const categoryDeleteButton = trashIcon?.closest("button") as HTMLButtonElement;

    if (categoryDeleteButton) {
      fireEvent.click(categoryDeleteButton);
      
      const confirmDeleteButton = screen.getByRole("button", { name: "Delete" });
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(apiClient).toHaveBeenCalledWith(
          "/api/v1/categories/cat-1",
          expect.objectContaining({ method: "DELETE" })
        );
        expect(toast.success).toHaveBeenCalledWith("Category deleted");
      });
    } else {
      throw new Error("Category delete button not found");
    }
  });

  it("switches to Danger Zone and deletes a book via OTP workflow", async () => {
    render(<BookDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Holiday Budget")).toBeInTheDocument();
    });

    // Click Danger Zone Tab
    const dangerTab = screen.getByRole("button", { name: "Danger Zone" });
    fireEvent.click(dangerTab);

    // Expect Delete Book panel
    const requestDeleteButton = screen.getByRole("button", { name: "Delete Book" });
    expect(requestDeleteButton).toBeInTheDocument();

    fireEvent.click(requestDeleteButton);

    // Dialog showing confirmation with received code
    await waitFor(() => {
      expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
      expect(screen.getByText(/A deletion request has been initiated/i)).toBeInTheDocument();
    });

    const codeInput = screen.getByLabelText("Enter Code");
    fireEvent.change(codeInput, { target: { value: "998877" } });

    // Submit final deletion
    const finalDeleteButton = screen.getByRole("button", { name: "Delete Permanently" });
    fireEvent.click(finalDeleteButton);

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith(
        "/api/v1/books/book-123",
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify({ otp: "998877" }),
        })
      );
      expect(mockRouter.push).toHaveBeenCalledWith("/books");
    });
  });
});
