import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as api from "@/lib/api";

interface AuthContextValue {
  isAdmin: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("tortilla-admin-token");
    if (token) {
      api.verifyToken(token).then((valid) => {
        if (valid) {
          setIsAdmin(true);
        } else {
          api.clearToken();
        }
      }).catch(() => {
        api.clearToken();
      });
    }
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      await api.login(password);
      setIsAdmin(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    api.clearToken();
    setIsAdmin(false);
  }, []);

  const value = useMemo(
    () => ({ isAdmin, login, logout }),
    [isAdmin, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
