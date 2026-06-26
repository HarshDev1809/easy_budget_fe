import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SignupPage from "./page";
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

describe("SignupPage", () => {
  const mockRouter = useRouter();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form elements", () => {
    render(<SignupPage />);
    expect(screen.getByText("Create an account")).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Password")[0]).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
  });

  it("shows validation errors for empty fields on submit", async () => {
    const { container } = render(<SignupPage />);
    const form = container.querySelector("form")!;

    fireEvent.submit(form);

    expect(await screen.findByText("Name must be at least 2 characters.")).toBeInTheDocument();
    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();
    expect(await screen.findByText("Password must be at least 8 characters.")).toBeInTheDocument();
  });

  it("shows error if passwords do not match", async () => {
    const { container } = render(<SignupPage />);
    const nameInput = screen.getByLabelText("Full Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getAllByLabelText("Password")[0];
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const form = container.querySelector("form")!;

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "different123" } });
    fireEvent.submit(form);

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("calls apiClient and redirects to dashboard on successful signup", async () => {
    const { container } = render(<SignupPage />);
    const nameInput = screen.getByLabelText("Full Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getAllByLabelText("Password")[0];
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const form = container.querySelector("form")!;

    vi.mocked(apiClient).mockResolvedValueOnce({ success: true });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith(
        "/api/auth/sign-up/email",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Account created successfully!", expect.any(Object));
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error toast if signup fails", async () => {
    const { container } = render(<SignupPage />);
    const nameInput = screen.getByLabelText("Full Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getAllByLabelText("Password")[0];
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const form = container.querySelector("form")!;

    vi.mocked(apiClient).mockRejectedValueOnce(new Error("Email already in use"));

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Signup failed", expect.objectContaining({
        description: "Email already in use",
      }));
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
});
