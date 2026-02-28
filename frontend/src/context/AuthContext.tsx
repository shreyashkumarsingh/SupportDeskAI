import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  email: string;
  name?: string | null;
  role?: 'admin' | 'agent' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginAsDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_AUDIT_KEY = 'supportdesk_auth_audit';

const logAuthAudit = (eventType: string, email?: string, role?: string) => {
  try {
    const existing = JSON.parse(localStorage.getItem(AUTH_AUDIT_KEY) || '[]');
    const next = [
      {
        id: crypto.randomUUID(),
        eventType,
        email: email || null,
        role: role || null,
        timestamp: new Date().toISOString(),
      },
      ...existing,
    ].slice(0, 200);
    localStorage.setItem(AUTH_AUDIT_KEY, JSON.stringify(next));
  } catch {
  }
};

/**
 * Mock Auth Implementation for Local Development & Testing
 * Stores users in localStorage - no external service needed
 */
const useMockAuth = () => {
  const MOCK_USERS_KEY = 'supportdesk_mock_users';
  const MOCK_SESSION_KEY = 'supportdesk_mock_session';

  const getMockUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const setMockUsers = (users: Record<string, { password: string; name: string }>) => {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  };

  // Initialize demo account on first run
  const initializeDemoAccount = () => {
    const users = getMockUsers();
    if (!users['demo@example.com']) {
      users['demo@example.com'] = {
        password: 'DemoPass123',
        name: 'Demo User'
      };
      setMockUsers(users);
    }
  };

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  
  // Lenient validation for mock mode (easier for testing)
  const validatePassword = (password: string) => password.length >= 6;

  const login = (email: string, password: string): boolean => {
    if (!validateEmail(email)) return false;
    if (!validatePassword(password)) return false;

    const users = getMockUsers();
    const user = users[email.toLowerCase()];

    if (!user || user.password !== password) return false;

    const role = email.toLowerCase().startsWith('admin') ? 'admin' : 'agent';
    const mockUser = { id: email, email, name: user.name, role };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser));
    return true;
  };

  const signup = (name: string, email: string, password: string): { success: boolean; error?: string } => {
    if (!name.trim()) {
      return { success: false, error: 'Name is required' };
    }
    if (!validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (!validatePassword(password)) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const users = getMockUsers();
    const normalizedEmail = email.toLowerCase();

    if (users[normalizedEmail]) {
      return { success: false, error: 'This email is already registered' };
    }

    users[normalizedEmail] = { password, name };
    setMockUsers(users);

    const role = email.toLowerCase().startsWith('admin') ? 'admin' : 'agent';
    const mockUser = { id: email, email, name, role };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser));
    return { success: true };
  };

  const getSession = (): User | null => {
    try {
      return JSON.parse(localStorage.getItem(MOCK_SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem(MOCK_SESSION_KEY);
  };

  const loginAsDemo = (): boolean => {
    initializeDemoAccount();
    return login('demo@example.com', 'DemoPass123');
  };

  return { login, signup, getSession, logout, loginAsDemo, initializeDemoAccount };
};

/**
 * Real Supabase Auth Implementation for Production
 */
const useRealAuth = () => {
  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  
  // Strict validation for production
  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasMinLength && hasUpper && hasLower && hasNumber;
  };

  const login = async (email: string, password: string) => {
    if (!supabase) {
      return { success: false, error: 'Authentication service not configured' };
    }
    if (!validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (!validatePassword(password)) {
      return { success: false, error: 'Password must be at least 8 characters with uppercase, lowercase, and numbers' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: 'Invalid email or password' };
    }

    return { success: true };
  };

  const signup = async (name: string, email: string, password: string) => {
    if (!supabase) {
      return { success: false, error: 'Authentication service not configured' };
    }
    if (!name.trim()) {
      return { success: false, error: 'Name is required' };
    }
    if (!validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (!validatePassword(password)) {
      return { success: false, error: 'Password must be at least 8 characters with uppercase, lowercase, and numbers' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  return { login, signup };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const useMockMode = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
  const mockAuth = useMockAuth();
  const realAuth = useRealAuth();

  // Initialize Auth
  useEffect(() => {
    if (useMockMode) {
      /**
       * Mock Auth Mode - For local development & testing
       * - No external service needed
       * - Uses browser localStorage
       * - Fast iteration and demos
       */
      mockAuth.initializeDemoAccount();
      const session = mockAuth.getSession();
      setUser(session);
      setIsLoading(false);
    } else {
      /**
       * Real Supabase Mode - For production
       * - Requires Supabase project setup
       * - Real user persistence
       * - Enterprise-ready
       */
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
            role: sessionUser.user_metadata?.role || 'agent',
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
            role: sessionUser.user_metadata?.role || 'agent',
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        listener?.subscription.unsubscribe();
      };
    }
  }, [useMockMode]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (useMockMode) {
      if (mockAuth.login(email, password)) {
        const name = email.split('@')[0];
        const role = email.toLowerCase().startsWith('admin') ? 'admin' : 'agent';
        setUser({ id: email, email, name, role });
        logAuthAudit('login_success', email, role);
        return { success: true };
      }
      logAuthAudit('login_failed', email, undefined);
      return { success: false, error: 'Invalid email or password. Please check your credentials and try again, or sign up for a new account.' };
    } else {
      const result = await realAuth.login(email, password);
      if (result.success) {
        // Session will be set by Supabase listener
      }
      return result;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (useMockMode) {
      const result = mockAuth.signup(name, email, password);
      if (result.success) {
        const role = email.toLowerCase().startsWith('admin') ? 'admin' : 'agent';
        setUser({ id: email, email, name, role });
        logAuthAudit('signup_success', email, role);
        return { success: true };
      }
      logAuthAudit('signup_failed', email, undefined);
      return { success: false, error: result.error };
    } else {
      const result = await realAuth.signup(name, email, password);
      if (result.success) {
        // Session will be set by Supabase listener
      }
      return result;
    }
  };

  const logout = async () => {
    if (useMockMode) {
      mockAuth.logout();
    } else if (supabase) {
      await supabase.auth.signOut();
    }
    logAuthAudit('logout', user?.email || undefined, user?.role || undefined);
    setUser(null);
  };

  const loginAsDemo = async () => {
    if (useMockMode) {
      if (mockAuth.loginAsDemo()) {
        const session = mockAuth.getSession();
        setUser(session);
      }
    }
    // For real Supabase, this would need a pre-created demo account
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, loginAsDemo }}>
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
