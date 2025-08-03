import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  customHeaders?: string | Record<string, string> | undefined,
): Promise<Response> {
  // Default headers
  let headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add custom headers if provided
  if (customHeaders) {
    if (typeof customHeaders === 'string') {
      const [headerName, headerValue] = customHeaders.split(':').map(s => s.trim());
      headers[headerName] = headerValue;
    } else {
      headers = { ...headers, ...customHeaders };
    }
  }
  
  const res = await fetch(url, {
    method,
    headers,
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
    const res = await fetch(queryKey[0] as string, {
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
      refetchInterval: 15000, // Refetch data every 15 seconds to keep content fresh
      refetchOnWindowFocus: true, // Enable refetching when window gets focus
      staleTime: 10000, // Consider data stale after 10 seconds
      gcTime: 5 * 60 * 1000, // Garbage collect after 5 minutes
      retry: 1, // Retry once on failure
      retryDelay: 1000, // Delay retry by 1 second
    },
    mutations: {
      retry: 1, // Retry once on failure
      retryDelay: 1000, // Delay retry by 1 second
    },
  },
});
