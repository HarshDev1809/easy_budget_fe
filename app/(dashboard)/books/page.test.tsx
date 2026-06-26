import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BooksPage from "./page";
import { apiClient } from "@/lib/api-client";
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

describe("BooksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loader on initial fetch", () => {
    // Keep fetch pending
    vi.mocked(apiClient).mockImplementation(() => new Promise(() => {}));
    const { container } = render(<BooksPage />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders a list of books when fetch is successful", async () => {
    const mockBooks = [
      {
        id: "book-1",
        name: "Personal Budget 2026",
        baseAmount: 15000,
        createdAt: "2026-06-01T12:00:00Z",
        updatedAt: "2026-06-25T12:00:00Z",
      },
      {
        id: "book-2",
        name: "Business Ledger",
        baseAmount: 250000,
        createdAt: "2026-05-01T12:00:00Z",
        updatedAt: "2026-06-26T12:00:00Z",
      },
    ];

    vi.mocked(apiClient).mockResolvedValueOnce({
      success: true,
      data: mockBooks,
    });

    const { container } = render(<BooksPage />);

    // Wait for loader to disappear
    await waitFor(() => {
      expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Personal Budget 2026")).toBeInTheDocument();
    expect(screen.getByText("Business Ledger")).toBeInTheDocument();
    
    // Check if link matches path
    const link1 = screen.getByText("Personal Budget 2026").closest("a");
    expect(link1).toHaveAttribute("href", "/book-1");
  });

  it("renders empty state when no books are returned", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      success: true,
      data: [],
    });

    const { container } = render(<BooksPage />);

    await waitFor(() => {
      expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
    });

    expect(screen.getByText("No books found.")).toBeInTheDocument();
    expect(screen.getByText("Create your first book to start tracking your finances.")).toBeInTheDocument();
  });

  it("displays error card when API returns success: false", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      success: false,
      message: "Server database is down",
    });

    const { container } = render(<BooksPage />);

    await waitFor(() => {
      expect(screen.getByText("Server database is down")).toBeInTheDocument();
    });

    const tryAgainButton = screen.getByRole("button", { name: "Try Again" });
    expect(tryAgainButton).toBeInTheDocument();

    // Trigger API call again
    vi.mocked(apiClient).mockResolvedValueOnce({
      success: true,
      data: [],
    });
    fireEvent.click(tryAgainButton);

    await waitFor(() => {
      expect(screen.getByText("No books found.")).toBeInTheDocument();
    });
  });

  it("refreshes books when clicking the refresh button", async () => {
    vi.mocked(apiClient)
      .mockResolvedValueOnce({
        success: true,
        data: [],
      })
      .mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: "book-abc",
            name: "Fresh Book",
            baseAmount: 100,
            updatedAt: "2026-06-26T12:00:00Z",
          },
        ],
      });

    render(<BooksPage />);

    await waitFor(() => {
      expect(screen.getByText("No books found.")).toBeInTheDocument();
    });

    const refreshButton = screen.getAllByTitle("Refresh books")[0];
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText("Fresh Book")).toBeInTheDocument();
    });
  });
});
