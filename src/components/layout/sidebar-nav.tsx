
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Ticket, Github, Server, Settings, ListChecks, UserCog, ShieldCheck, LineChart as AnalyticsIcon, History, Layers, Users } from "lucide-react"; // Added Users for superuser
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

const baseAdminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jira", label: "Jira Tickets", icon: Ticket },
  { href: "/github", label: "GitHub Commits", icon: Github },
  { href: "/maximo", label: "Maximo Mgmt", icon: Server },
  { href: "/deployments", label: "Deployment Logs", icon: Layers },
  { href: "/audit-log", label: "Audit Log", icon: History },
  { href: "/admin-profile", label: "Admin Profile", icon: ShieldCheck }, 
];

const superUserNavItems = [
  ...baseAdminNavItems.filter(item => item.href !== "/admin-profile"), // Remove default admin profile
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  // Add superuser specific items like User Management if needed in the future
  // { href: "/user-management", label: "User Management", icon: Users }, 
  { href: "/admin-profile", label: "SuperUser Profile", icon: ShieldCheck }, // Specific profile link for superuser
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
  } else if (user.role === 'admin') {
    navItems = baseAdminNavItems;
  } else if (user.role === 'superuser') {
    navItems = superUserNavItems;
  }
   else {
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

