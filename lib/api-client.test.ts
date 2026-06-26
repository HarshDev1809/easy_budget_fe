import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "./api-client";

describe("apiClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("sends fetch request with default options and content-type header", async () => {
    const mockResponseData = { success: true, data: "test" };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    });

    const result = await apiClient("/api/v1/test-endpoint", {
      method: "POST",
      body: JSON.stringify({ key: "value" }),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/v1/test-endpoint",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ key: "value" }),
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
    expect(result).toEqual(mockResponseData);
  });

  it("prefers custom headers and options over defaults", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiClient("/api/v1/test", {
      headers: {
        "Content-Type": "text/plain",
        "X-Custom-Header": "custom-value",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/v1/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "text/plain",
          "X-Custom-Header": "custom-value",
        }),
      })
    );
  });

  it("throws error with message from JSON error response if response is not ok", async () => {
    const mockErrorResponse = { message: "Unauthorized access" };
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => mockErrorResponse,
    });

    await expect(apiClient("/api/v1/secure")).rejects.toThrow("Unauthorized access");
  });

  it("throws error with generic HTTP message if JSON parsing fails", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("parsing failed");
      },
    });

    await expect(apiClient("/api/v1/broken")).rejects.toThrow("HTTP error! status: 500");
  });
});
