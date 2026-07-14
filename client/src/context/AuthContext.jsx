import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setAuthToken, TOKEN_KEY } from '../api/client.js';
import { authApi } from '../api/endpoints.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const { user, profile } = await authApi.me();
      setUser(user);
      setProfile(profile);
    } catch {
      setUser(null);
      setProfile(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) loadMe();
    else setLoading(false);
  }, [loadMe]);

  const handleAuth = ({ token, user }) => {
    setAuthToken(token);
    setUser(user);
    loadMe(); // pull the profile so the nav avatar (logo/photo) is available (§10)
    return user;
  };

  const login = async (credentials) => handleAuth(await authApi.login(credentials));
  const registerCompany = async (data) => handleAuth(await authApi.registerCompany(data));
  const registerCreator = async (data) => handleAuth(await authApi.registerCreator(data));

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    isAuthed: Boolean(user),
    login,
    registerCompany,
    registerCreator,
    logout,
    refresh: loadMe,
    setUser,
    setProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
