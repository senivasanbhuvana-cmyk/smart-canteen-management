import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smartbite_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('smartbite_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  const { showSuccess, showError } = useToast();

  const openAuthModal = useCallback((mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  // Fetch current user from token on initial mount
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('smartbite_token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          setUser(res.user);
          localStorage.setItem('smartbite_user', JSON.stringify(res.user));
        } catch {
          // Token expired or invalid
          setUser(null);
          setToken(null);
          localStorage.removeItem('smartbite_token');
          localStorage.removeItem('smartbite_user');
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login({ email, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('smartbite_token', data.token);
      localStorage.setItem('smartbite_user', JSON.stringify(data.user));
      closeAuthModal();
      showSuccess(`Welcome back, ${data.user.name}!`);
      return { success: true, user: data.user };
    } catch (err) {
      showError(err.message || 'Login failed. Please check credentials.');
      return { success: false, error: err.message };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authAPI.register(userData);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('smartbite_token', data.token);
      localStorage.setItem('smartbite_user', JSON.stringify(data.user));
      closeAuthModal();
      showSuccess(`Registration complete! Welcome to SmartBite, ${data.user.name}.`);
      return { success: true, user: data.user };
    } catch (err) {
      showError(err.message || 'Registration failed. Please check your information.');
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout endpoint error, clear local state
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('smartbite_token');
    localStorage.removeItem('smartbite_user');
    showSuccess('Logged out successfully.');
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        isStudent,
        login,
        register,
        logout,
        authModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
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
