import Constants from "expo-constants";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Gets the base URL for the Express API server (e.g., "http://localhost:5000")
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // In web browser, use the same origin since Metro proxies /api/* to backend
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin + "/";
  }

  // For native apps, try to use the manifest debugger host (host IP)
  // This works for both physical devices and emulators
  const debuggerHost = Constants.expoConfig?.hostUri;
  const host = debuggerHost?.split(`:`)[0];

  if (host && host !== "localhost") {
    return `http://${host}:5000/`;
  }

  // Fallback for Android emulator (10.0.2.2) vs Physical Device (EXPO_PUBLIC_API_URL)
  const serverUrl = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000";
  return serverUrl.endsWith("/") ? serverUrl : serverUrl + "/";
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const baseUrl = getApiUrl();
      const url = new URL(queryKey.join("/") as string, baseUrl);

      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
