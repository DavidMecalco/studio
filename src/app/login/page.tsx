
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import CompanyLogo from '@/components/layout/company-logo';
import { Mail, Lock, Loader2, LogIn } from 'lucide-react'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password, callbackUrl);
      // Redirect is handled by the login function in AuthContext
    } catch (err) {
      setError((err as Error).message || 'Login failed. Please check your credentials.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <CompanyLogo className="mx-auto h-16 w-auto mb-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome to Maximo Portal
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your gateway to efficient Maximo version management.
          </p>
        </div>

        <Card className="shadow-2xl rounded-xl border-border/50">
          <CardHeader className="p-6 sm:p-8">
            <CardTitle className="text-2xl flex items-center gap-2">
              <LogIn className="h-6 w-6 text-primary" /> Secure Login
            </CardTitle>
            <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 h-11 text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                 <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 h-11 text-base"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive font-medium text-center py-2 px-3 bg-destructive/10 rounded-md">{error}</p>}
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
         <p className="mt-6 text-center text-sm text-muted-foreground">
          Hint: Use any seeded email and its corresponding password (e.g., `admin@portal.com` / `password`).
        </p>
      </div>
    </div>
  );
}

