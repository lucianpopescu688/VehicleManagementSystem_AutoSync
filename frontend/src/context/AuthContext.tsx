import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, role: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Simplified JWT decode to get email
  const parseJwtEmail = (token: string): string | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload).sub;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (token) {
      const email = parseJwtEmail(token);
      const storedRole = localStorage.getItem('role') || 'FLEET_MANAGER';
      if (email) {
        setUser({ email, role: storedRole });
      } else {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email: string, password: string, role: string) => {
    const data = await api('/auth/authenticate', {
      method: 'POST',
      data: { email, password },
    });
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', role); // Store role for demo persistence
      setToken(data.token);
      setUser({ email, role });
    }
  };

  const register = async (regData: any) => {
    await api('/auth/register', {
      method: 'POST',
      data: regData,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
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
