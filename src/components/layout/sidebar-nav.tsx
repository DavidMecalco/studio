
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Ticket, Github, Server, Settings, ListChecks, UserCog, ShieldCheck, LineChart as AnalyticsIcon, History, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jira", label: "Jira Tickets", icon: Ticket },
  { href: "/github", label: "GitHub Commits", icon: Github },
  { href: "/maximo", label: "Maximo Mgmt", icon: Server },
  { href: "/deployments", label: "Deployment Logs", icon: Layers },
  { href: "/audit-log", label: "Audit Log", icon: History },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { href: "/admin-profile", label: "Admin Profile", icon: ShieldCheck }, 
  // { href: "/settings", label: "Settings", icon: Settings }, // Example for future
];

const clientNavItems = [
   { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, 
   { href: "/my-tickets", label: "My Tickets", icon: ListChecks },
   { href: "/profile", label: "My Profile", icon: UserCog },
];


export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = user?.role === 'client' ? clientNavItems : adminNavItems;

  if (!user) return null; // Or a loading state/skeleton

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
            tooltip={item.label}
            className={cn(
              (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))
                ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

