import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "./page";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
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

describe("LoginPage", () => {
  const mockRouter = useRouter();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form elements", () => {
    render(<LoginPage />);
    expect(screen.getByText("Login", { selector: "[data-slot=card-title]" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
  });

  it("shows validation errors for empty fields on submit", async () => {
    const { container } = render(<LoginPage />);
    const form = container.querySelector("form")!;

    fireEvent.submit(form);

    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();
    expect(await screen.findByText("Password is required.")).toBeInTheDocument();
  });

  it("shows validation error for invalid email format", async () => {
    const { container } = render(<LoginPage />);
    const emailInput = screen.getByLabelText("Email");
    const form = container.querySelector("form")!;

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.submit(form);

    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();
  });

  it("toggles password visibility when the eye button is clicked", () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
    const toggleButton = screen.getByRole("button", { name: "Show password" });

    expect(passwordInput.type).toBe("password");

    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();

    // Click to hide password
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(passwordInput.type).toBe("password");
  });

  it("calls apiClient and redirects to dashboard on successful login", async () => {
    const { container } = render(<LoginPage />);
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const form = container.querySelector("form")!;

    // Mock API Client success
    vi.mocked(apiClient).mockResolvedValueOnce({ success: true });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith(
        "/api/auth/sign-in/email",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "user@example.com",
            password: "password123",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Login successful!", expect.any(Object));
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error toast if apiClient throws an error", async () => {
    const { container } = render(<LoginPage />);
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const form = container.querySelector("form")!;

    // Mock API Client failure
    vi.mocked(apiClient).mockRejectedValueOnce(new Error("Invalid credentials"));

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrong-password" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Login failed", expect.objectContaining({
        description: "Invalid credentials",
      }));
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
});
