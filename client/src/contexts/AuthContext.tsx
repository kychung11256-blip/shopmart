import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化時從 localStorage 恢復用戶狀態
  useEffect(() => {
    const savedUser = localStorage.getItem('shopmart_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    // 模擬登入 - 實際應用應使用真實 API
    // 預設用戶：admin@example.com / admin123 (管理員)
    // 預設用戶：user@example.com / user123 (普通用戶)
    
    if (email === 'admin@example.com' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin-001',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      setUser(adminUser);
      setIsAuthenticated(true);
      localStorage.setItem('shopmart_user', JSON.stringify(adminUser));
      return;
    }

    if (email === 'user@example.com' && password === 'user123') {
      const regularUser: User = {
        id: 'user-001',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      setUser(regularUser);
      setIsAuthenticated(true);
      localStorage.setItem('shopmart_user', JSON.stringify(regularUser));
      return;
    }

    throw new Error('Invalid email or password');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('shopmart_user');
  };

  const register = async (email: string, password: string, name: string) => {
    // 模擬註冊 - 實際應用應使用真實 API
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      role: 'user', // 新用戶預設為普通用戶
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('shopmart_user', JSON.stringify(newUser));
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    if (user && user.id === userId) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem('shopmart_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, register, updateUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
