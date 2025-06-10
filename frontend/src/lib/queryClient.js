import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in older versions)
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: 1
    }
  }
});

// Query keys for consistent cache management
export const queryKeys = {
  health: ["health"],
  driveFiles: ["drive", "files"],
  gmailMessages: ["gmail", "messages"],
  trelloBoards: ["trello", "boards"],
  trelloCards: ["trello", "cards"],
  ai: ["ai"]
};
