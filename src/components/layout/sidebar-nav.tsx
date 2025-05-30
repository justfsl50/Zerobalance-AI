
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutDashboard, ListChecks, Target, BarChart3, Settings, Users, PlusCircle, MessageSquare, Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Chat", icon: MessageSquare },
  { href: "/summary-dashboard", label: "View Summary", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ListChecks },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/roommates", label: "Roommates", icon: Users },
];

const actionNavItems: NavItem[] = [
  { href: "/transactions?action=add", label: "Add Transaction", icon: PlusCircle },
  { href: "/budgets?action=add", label: "Add Budget", icon: Target },
];

const settingsItem: NavItem = { href: "/settings", label: "Settings", icon: Settings, disabled: false };

export function SidebarNav() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="flex items-center p-4 h-16 justify-start">
        {state === 'expanded' && (
          <Link href="/dashboard" className="flex items-center text-xl font-semibold text-sidebar-foreground" aria-label={APP_NAME}>
            <Sparkles className="h-8 w-8 text-primary mr-2" />
            <span className="font-mono text-primary">ZERO</span>
            <span className="text-sidebar-foreground">BALANCE</span>
          </Link>
        )}
      </SidebarHeader>

      {state === 'expanded' && (
        <>
          <ScrollArea className="flex-1">
            <SidebarContent className="p-2">
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref legacyBehavior>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard') || (item.href === "/dashboard" && (pathname === "/dashboard" || pathname === "/"))}
                        aria-disabled={item.disabled}
                        disabled={item.disabled}
                      >
                        <a>
                          <item.icon />
                          <span>{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              <SidebarMenu className="mt-4">
                  <SidebarMenuItem>
                    <span className="px-2 py-1 text-xs font-semibold text-muted-foreground">Actions</span>
                  </SidebarMenuItem>
                {actionNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref legacyBehavior>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href.split('?')[0]) && pathname.includes(item.href.split('?')[1] || '')}
                        aria-disabled={item.disabled}
                        disabled={item.disabled}
                      >
                        <a>
                          <item.icon />
                          <span>{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </ScrollArea>
          <SidebarFooter className="p-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href={settingsItem.href} passHref legacyBehavior>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith(settingsItem.href)}
                            aria-disabled={settingsItem.disabled}
                            disabled={settingsItem.disabled}
                        >
                            <a><settingsItem.icon /><span>{settingsItem.label}</span></a>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </>
      )}
    </Sidebar>
  );
}
