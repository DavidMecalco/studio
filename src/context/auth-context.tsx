
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string; // Unique ID, can be username or a generated UID
  username: string;
  name: string; 
  email: string; // Added email
  password?: string; // Added password (for mock purposes, plain text)
  role: 'admin' | 'client' | 'superuser';
  company?: string; 
  phone?: string;
  position?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, passwordAttempt: string, redirectPath?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        if (parsedUser && parsedUser.id && parsedUser.username && parsedUser.email && parsedUser.role && parsedUser.name) { // Added email check
           setUser(parsedUser);
        } else {
            localStorage.removeItem('authUser');
        }
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, passwordAttempt: string, redirectPath: string = '/') => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let authenticatedUser: User | null = null;
    const allUsersString = localStorage.getItem('firestore_mock_users'); 
    
    if (allUsersString) {
        try {
            const allUsers: User[] = JSON.parse(allUsersString);
            // Find user by email and "check" password
            authenticatedUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === passwordAttempt) || null;
        } catch (e) {
            console.error("Error parsing mock users from localStorage during login", e);
        }
    }
    
    if (authenticatedUser) {
      setUser(authenticatedUser);
      localStorage.setItem('authUser', JSON.stringify(authenticatedUser)); 
      router.push(redirectPath);
      // Simulate email notification for login (client-side for mock)
      console.log(`Simulated Email Notification: User ${authenticatedUser.email} logged in successfully.`);
    } else {
      // If user not found via localStorage check, or password mismatch
      // For this mock, we throw an error. A real app might handle this more gracefully.
      throw new Error('Invalid email or password.');
    }
  };

  const logout = () => {
    if(user) {
        console.log(`Simulated Email Notification: User ${user.email} logged out.`);
    }
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
