import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

interface User {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasMinLength && hasUpper && hasLower && hasNumber;
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email ?? '',
          name: sessionUser.user_metadata?.name || sessionUser.email,
        });
      }
      setIsLoading(false);
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email ?? '',
          name: sessionUser.user_metadata?.name || sessionUser.email,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured. Check env vars.' };
    }

    if (!validateEmail(email)) {
      return { success: false, error: 'Enter a valid email address.' };
    }

    if (!validatePassword(password)) {
      return { success: false, error: 'Password must be 8+ chars with upper, lower, and a number.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const message = error.message?.toLowerCase().includes('invalid')
        ? 'Invalid credentials. Please sign up if you are new.'
        : error.message;
      return { success: false, error: message };
    }

    const sessionUser = data.user;
    if (sessionUser) {
      setUser({
        id: sessionUser.id,
        email: sessionUser.email ?? '',
        name: sessionUser.user_metadata?.name || sessionUser.email,
      });
    }
    return { success: true };
  };

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured. Check env vars.' };
    }

    if (!name.trim()) {
      return { success: false, error: 'Name is required.' };
    }

    if (!validateEmail(email)) {
      return { success: false, error: 'Enter a valid email address.' };
    }

    if (!validatePassword(password)) {
      return { success: false, error: 'Password must be 8+ chars with upper, lower, and a number.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const sessionUser = data.user;
    if (sessionUser) {
      setUser({
        id: sessionUser.id,
        email: sessionUser.email ?? '',
        name: sessionUser.user_metadata?.name || sessionUser.email,
      });
    }
    return { success: true };
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
