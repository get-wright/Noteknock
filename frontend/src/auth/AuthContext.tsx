import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth";
import { clearToken, getToken, setToken } from "../api/client";

export type User = { id: string; name: string; email: string };

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  completeOAuth: (code: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = getToken();
      if (!existing) {
        setLoading(false);
        return;
      }
      try {
        await authApi.authCheck();
        const me = await authApi.getMe();
        if (!cancelled) setUser(me);
      } catch {
        clearToken();
        if (!cancelled) setTokenState(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const t = await authApi.login(email, password);
    setToken(t.access_token);
    setTokenState(t.access_token);
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch (err) {
      clearToken();
      setTokenState(null);
      setUser(null);
      throw err;
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    const t = await authApi.register(data);
    setToken(t.access_token);
    setTokenState(t.access_token);
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch (err) {
      clearToken();
      setTokenState(null);
      setUser(null);
      throw err;
    }
  };

  const completeOAuth = async (code: string) => {
    const t = await authApi.loginWithGoogleCode(code);
    setToken(t.access_token);
    setTokenState(t.access_token);
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch (err) {
      clearToken();
      setTokenState(null);
      setUser(null);
      throw err;
    }
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, completeOAuth, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}