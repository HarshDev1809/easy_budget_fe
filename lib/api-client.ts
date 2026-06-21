const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    // Better-Auth uses cookies, so we must include credentials
    credentials: "include",
  };

  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Not JSON or empty body
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
