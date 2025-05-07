
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
  { href: "/admin-profile", label: "Profile", icon: ShieldCheck }, 
  // { href: "/settings", label: "Settings", icon: Settings }, // Example for future
  // Future superuser specific items:
  // { href: "/user-management", label: "User Management", icon: UsersRound },
  // { href: "/client-setup", label: "Client Setup", icon: Building },
];

const clientNavItems = [
   { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, 
   { href: "/my-tickets", label: "My Tickets", icon: ListChecks },
   { href: "/profile", label: "My Profile", icon: UserCog },
];


export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null; // Or a loading state/skeleton

  let navItems;
  if (user.role === 'client') {
    navItems = clientNavItems;
  } else if (user.role === 'admin' || user.role === 'superuser') {
    // Superuser gets admin navigation items. Specific superuser items can be added here later.
    // For the "Profile" link, adminNavItems already points to /admin-profile.
    // We will adjust the title on the /admin-profile page itself.
    navItems = adminNavItems;
  } else {
    return null; // Should not happen for authenticated users
  }


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

