
"use client";

import Link from "next/link";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle, SquarePen } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export function Header() {
  const { currentUser, logoutUser, authLoading, triggerChatReset } = useAppContext();
  const router = useRouter();
  const { open: isSidebarOpen } = useSidebar();

  const handleLogout = async () => {
    await logoutUser();
  };

  const handleNewChat = () => {
    triggerChatReset();
    router.push('/dashboard');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center bg-background px-4 sm:px-6">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="[&_svg]:h-5 [&_svg]:w-5" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{isSidebarOpen ? "Close sidebar" : "Open sidebar"}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" onClick={handleNewChat} aria-label="New Chat" className="h-7 w-7 p-0 ml-2">
              <SquarePen className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>New Chat</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Link href="/dashboard" className="ml-4 text-xl font-semibold text-foreground">
        <span className="font-mono text-primary">ZERO</span>
        <span>BALANCE</span>
      </Link>
      <div className="ml-auto flex items-center gap-2 md:gap-4">
        {authLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-primary border-l-primary"></div>
        ) : currentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : <UserCircle className="h-5 w-5"/>}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {currentUser.displayName || currentUser.email}
                  </p>
                  {currentUser.email && (
                     <p className="text-xs leading-none text-muted-foreground">
                        {currentUser.email}
                     </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/login">Login</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
