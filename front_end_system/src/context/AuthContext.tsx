import { createContext, useContext, useEffect, useState } from "react";
import { setUnauthorizedHandler } from "../api/axiosClient";
import { storageService } from "../service/storage.service";

interface User {
  id: string;
  username: string;
  fullName: string;
  roles: string[];
}

type AuthContextType = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const loadStorageData = async () => {
    try {
      const storedToken = await storageService.getToken();
      const storedUser = await storageService.getUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser as User);
      }
    } catch (error) {
      console.error("Error loading auth data:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    storageService.clearAll().catch((error) => {
      console.error("Error clearing auth data on logout:", error);
    });
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
