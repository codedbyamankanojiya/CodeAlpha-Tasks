import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'collabtool_token';
const USER_KEY = 'collabtool_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while rehydrating from localStorage

  // ─── Rehydrate session on mount ─────────────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch {
        // Corrupted data — clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // ─── Persist token and user to localStorage ──────────────────────────────
  const persistSession = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  // ─── Register ────────────────────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password }) => {
    const response = await authAPI.register({ name, email, password });
    const { token: newToken, user: newUser } = response.data;
    persistSession(newToken, newUser);
    return response.data;
  }, [persistSession]);

  // ─── Login ───────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const response = await authAPI.login({ email, password });
    const { token: newToken, user: newUser } = response.data;
    persistSession(newToken, newUser);
    return response.data;
  }, [persistSession]);

  // ─── Logout ──────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // ─── Update user profile locally ────────────────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    register,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
