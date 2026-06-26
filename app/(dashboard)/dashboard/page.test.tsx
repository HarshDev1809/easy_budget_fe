import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "./page";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";

// Mock api-client
vi.mock("@/lib/api-client", () => ({
  apiClient: vi.fn(),
}));

describe("DashboardPage", () => {
  const mockRouter = useRouter();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading message initially", async () => {
    // Make session call stay pending to capture loading state
    vi.mocked(apiClient).mockImplementation(() => new Promise(() => {}));

    render(<DashboardPage />);
    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
  });

  it("fetches session and renders user details on success", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      success: true,
      data: {
        user: {
          name: "Jane Doe",
          email: "jane@example.com",
        },
      },
    });

    render(<DashboardPage />);

    // Wait for the loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText("Loading dashboard...")).not.toBeInTheDocument();
    });

    // Should display welcome back message (first name only)
    expect(screen.getByText("Welcome back, Jane!")).toBeInTheDocument();
    expect(screen.getByText("Total Balance")).toBeInTheDocument();
    expect(screen.getByText("Monthly Income")).toBeInTheDocument();
    expect(screen.getByText("Monthly Expenses")).toBeInTheDocument();
    expect(screen.getByText("Add your first transaction")).toBeInTheDocument();
  });

  it("redirects to login if session fetch returns success: false", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      success: false,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });
  });

  it("redirects to login if session fetch throws an error", async () => {
    vi.mocked(apiClient).mockRejectedValueOnce(new Error("Network Error"));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });
  });
});
