
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import type { JiraTicketProvider } from '@/services/jira'; // No longer needed here

export interface User {
  id: string; // Will store the username for mock simplicity
  username: string;
  name: string; // Full name of the user
  role: 'admin' | 'client' | 'superuser';
  company?: string; // Changed from JiraTicketProvider to string
  phone?: string;
  position?: string;
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
        const parsedUser = JSON.parse(storedUser) as User; // Cast to User
        // Basic validation of stored user structure
        if (parsedUser && parsedUser.id && parsedUser.username && parsedUser.role && parsedUser.name) { // Added check for name
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
    
    let mockUserDetails: User | null = null;

    const allUsersString = localStorage.getItem('firestore_mock_users'); 
    if (allUsersString) {
        try {
            const allUsers: User[] = JSON.parse(allUsersString);
            mockUserDetails = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
        } catch (e) {
            console.error("Error parsing mock users from localStorage", e);
        }
    }
    
    if (!mockUserDetails) { 
        let role: User['role'];
        let company: User['company'] = 'Other Company';
        let phone = 'N/A';
        let position = 'N/A';
        let name = username; // Default name to username if not found

        if (username.toLowerCase() === 'superuser') {
          role = 'superuser';
          position = 'System Super User';
          company = 'System Corp';
          phone = '555-9999';
          name = 'Super Usuario Portal';
        } else if (username.toLowerCase().startsWith('client')) {
          role = 'client';
          position = 'Client User';
          name = `Cliente ${username.substring(7) || 'Genérico'}`;
          if (username.toLowerCase().includes('tla')) {
            company = 'TLA';
            phone = '555-0101';
            name = `Cliente TLA ${username.replace(/client-tla/i, '') || 'Principal'}`;
          } else if (username.toLowerCase().includes('fema')) {
            company = 'FEMA';
            phone = '555-0202';
            name = `Cliente FEMA ${username.replace(/client-fema/i, '') || 'Principal'}`;
          } else {
            phone = '555-0303';
          }
        } else { 
          role = 'admin';
          position = 'System Administrator';
          company = 'Maximo Corp'; 
          phone = '555-0000';
          name = 'Administrator Portal';
        }
        mockUserDetails = { id: username, username, name, role, company, phone, position };
    }
        
    setUser(mockUserDetails);
    localStorage.setItem('authUser', JSON.stringify(mockUserDetails)); 
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

