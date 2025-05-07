
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string; // Will store the username for mock simplicity
  username: string;
  role: 'admin' | 'client';
  // email?: string; // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, redirectPath?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for persisted login state (e.g., from localStorage)
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Basic validation of stored user structure
        if (parsedUser && parsedUser.id && parsedUser.username && parsedUser.role) {
           setUser(parsedUser);
        } else {
            localStorage.removeItem('authUser'); // Clear invalid stored user
        }
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, redirectPath: string = '/') => {
    // Simulate API call for login
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const role = username.toLowerCase().startsWith('client') ? 'client' : 'admin';
    // For mock simplicity, use username as the ID. In a real app, ID would be from backend.
    const mockUser: User = { id: username, username, role }; 
    
    setUser(mockUser);
    localStorage.setItem('authUser', JSON.stringify(mockUser));
    router.push(redirectPath);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
