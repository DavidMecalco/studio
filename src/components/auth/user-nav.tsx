
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { LogOut, User as UserIcon, UserCog, ShieldCheck, Moon, Sun } from "lucide-react"; 
import Link from "next/link";
import { useTheme } from "@/context/theme-context";

export function UserNav() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!isAuthenticated) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Login</Link>
      </Button>
    );
  }
  
  if (!user) { 
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            {/* <AvatarImage src="/avatars/01.png" alt={user.username} /> */}
            <AvatarFallback>
              {user.username ? user.username.charAt(0).toUpperCase() : <UserIcon className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.role === 'client' ? user.company : 
               user.role === 'admin' ? 'Administrator' : 
               user.role === 'superuser' ? 'Super User' : ''}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === 'client' && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/profile">
              <UserCog className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </Link>
          </DropdownMenuItem>
        )}
        {(user.role === 'admin' || user.role === 'superuser') && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/admin-profile">
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>{user.role === 'superuser' ? 'Super User Profile' : 'Admin Profile'}</span>
            </Link>
          </DropdownMenuItem>
        )}
        
        {(user.role === 'client' || user.role === 'admin' || user.role === 'superuser') && <DropdownMenuSeparator />}
        
        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          {theme === 'light' ? (
            <Moon className="mr-2 h-4 w-4" />
          ) : (
            <Sun className="mr-2 h-4 w-4" />
          )}
          <span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
