
"use client";

import type { ReactNode } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarNav } from "./sidebar-nav";
import Link from "next/link";
import { MountainIcon, Plus } from "lucide-react"; 
import CompanyLogo from "./company-logo";
import { UserNav } from "@/components/auth/user-nav";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { useAuth } from "@/context/auth-context"; // Import useAuth

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuth(); // Get the current user

  const defaultOpen = typeof window !== "undefined" 
    ? document.cookie.includes("sidebar_state=true")
    : true;

  // Determine if the create ticket FAB should be shown
  // Show for admin and superuser, not for client (client will have button on My Tickets page)
  const showCreateTicketFab = user && (user.role === 'admin' || user.role === 'superuser');


  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="Maximo Version Portal">
            <MountainIcon className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Maximo Portal
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-sidebar-foreground/70">
            © {new Date().getFullYear()} Maximo Version Portal
          </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          {/* Empty div to push items to the right or manage spacing */}
          <div className="flex-1"></div> 
          <div className="flex items-center gap-4">
            <CompanyLogo className="h-7 w-auto" />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
        {/* Conditionally render CreateTicketDialog FAB */}
        {showCreateTicketFab && (
          <CreateTicketDialog 
            triggerButton={
              <button 
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Crear nuevo ticket"
              >
                <Plus className="h-7 w-7" />
              </button>
            } 
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
