import { QueryClient } from "@tanstack/react-query";
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
        const message = error instanceof Error ? error.message : "";

        // 401 → clear tokens so next render routes to login
        if (message === "UNAUTHORIZED") {
          void clearTokens();
          return;
        }

        // All other errors: let component handle via mutation state
        // (isPending/isError) — no silent swallowing
      },
    },
  },
});
