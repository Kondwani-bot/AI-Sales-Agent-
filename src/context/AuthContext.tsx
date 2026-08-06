import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { DEFAULT_USER } from '../constants';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (name: string, email: string, company: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('leadflow_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('leadflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('leadflow_user');
    }
  }, [user]);

  const login = async (email: string): Promise<boolean> => {
    // Simulate auth network delay
    await new Promise((res) => setTimeout(res, 600));
    const newUser: UserProfile = {
      ...DEFAULT_USER,
      email: email || DEFAULT_USER.email,
      name: email ? email.split('@')[0].replace('.', ' ') : DEFAULT_USER.name,
    };
    setUser(newUser);
    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    await new Promise((res) => setTimeout(res, 700));
    setUser(DEFAULT_USER);
    return true;
  };

  const register = async (name: string, email: string, company: string): Promise<boolean> => {
    await new Promise((res) => setTimeout(res, 600));
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: name || 'Growth Specialist',
      email: email || 'user@example.com',
      companyName: company || 'My Growth Startup',
      role: 'Growth Strategist',
      avatarUrl: DEFAULT_USER.avatarUrl,
    };
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
