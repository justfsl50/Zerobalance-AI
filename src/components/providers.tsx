
"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AppDataProvider } from "@/contexts/AppContext"; 
import { ThemeProvider } from "@/components/theme-provider";

// Create a client
const queryClient = new QueryClient();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppDataProvider>
          {children}
          <Toaster />
        </AppDataProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
