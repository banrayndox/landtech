import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('bhumilens_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('bhumilens_token'));
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verify token with backend
    if (token) {
      api.get('/auth/me')
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('bhumilens_user', JSON.stringify(userData));
        })
        .catch(() => {
          setUser(null);
          setToken(null);
          localStorage.removeItem('bhumilens_token');
          localStorage.removeItem('bhumilens_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

  const login = async (loginId, password, rememberMe = false) => {
    const res = await api.post('/auth/login', {
      login_id: loginId,
      password,
      remember_me: rememberMe,
    });

    if (!res || !res.access_token || !res.user) {
      throw new Error('সার্ভার থেকে সঠিক ইউজার ডেটা পাওয়া যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    }

    const accessToken = res.access_token;
    const userData = res.user;

    localStorage.setItem('bhumilens_token', accessToken);
    localStorage.setItem('bhumilens_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const register = async (registerData) => {
    return await api.post('/auth/register', registerData);
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('bhumilens_token');
    localStorage.removeItem('bhumilens_user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isOnline,
        login,
        register,
        logout,
        hasRole,
        isAuthenticated: !!token && !!user,
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
