
"use client"; 

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
 SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Header } from "@/components/layout/header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useAppContext } from "@/contexts/AppContext";
import { Skeleton } from "@/components/ui/skeleton"; 
import { useIsMobile } from "@/hooks/use-mobile"; 
 
export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentUser, authLoading, dataLoading } = useAppContext(); 
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace("/auth/login");
    }
  }, [currentUser, authLoading, router]);
 const isMobile = useIsMobile();

  if (authLoading || (currentUser && dataLoading)) { 
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="space-y-4 p-8 rounded-lg shadow-xl bg-card">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <p className="text-sm text-muted-foreground text-center">
            {authLoading ? "Authenticating..." : "Loading your data..."}
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null; 
  }

  return (
    <SidebarProvider defaultOpen={false}> {/* Sidebar starts collapsed by default */}
      <div className="flex min-h-screen w-full">
        <SidebarNav />
        <div className="flex flex-1 flex-col">
          <Header />
          <SidebarInset>
            <div className="flex flex-1 flex-col"> 
              <main className="flex-1 p-4 sm:p-6 bg-background">
                {children}
              </main>
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
