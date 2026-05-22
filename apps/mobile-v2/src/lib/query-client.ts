import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { clearTokens } from "@/lib/auth";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
    mutations: {
      onError: (error: unknown) => {
        // 401 → clear tokens so next render routes to login.
        // Message-string fallback kept for older code paths still throwing
        // plain Error("UNAUTHORIZED").
        if (error instanceof ApiError && error.status === 401) {
          void clearTokens();
          return;
        }
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          void clearTokens();
          return;
        }

        // All other errors: let component handle via mutation state
        // (isPending/isError) — no silent swallowing
      },
    },
  },
});
