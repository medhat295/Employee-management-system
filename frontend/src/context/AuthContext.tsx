import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import api from '../api/axios';
import type { AuthTokens, User } from '../types';

const TOKENS_KEY = 'auth_tokens';

interface AuthContextValue {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isHRManager: boolean;
  isEmployee: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredTokens(): AuthTokens | null {
  const raw = localStorage.getItem(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(readStoredTokens);

  const persist = useCallback((data: AuthTokens | null) => {
    if (data) {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(TOKENS_KEY);
    }
    setTokens(data);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<AuthTokens>('/auth/login/', { email, password });
      persist(data);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    if (tokens?.refresh) {
      try {
        await api.post('/auth/logout/', { refresh: tokens.refresh });
      } catch {
        // Clear session regardless of server response
      }
    }
    persist(null);
  }, [tokens, persist]);

  const user = tokens?.user ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isHRManager: user?.role === 'hr_manager',
        isEmployee: user?.role === 'employee',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
