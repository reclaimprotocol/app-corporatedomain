'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  email: string | null;
  login: (token: string, email: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token in localStorage on mount
    const storedToken = localStorage.getItem('authToken');
    const storedEmail = localStorage.getItem('userEmail');

    if (storedToken && storedEmail) {
      setToken(storedToken);
      setEmail(storedEmail);
    }

    setIsLoading(false);
  }, []);

  const login = (newToken: string, userEmail: string) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('userEmail', userEmail);
    setToken(newToken);
    setEmail(userEmail);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    setToken(null);
    setEmail(null);
  };

  return (
    <AuthContext.Provider value={{ token, email, login, logout, isLoading }}>
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
