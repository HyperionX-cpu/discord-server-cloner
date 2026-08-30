import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [license, setLicense] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [mutualGuilds, setMutualGuilds] = useState([]);
  const [nonBotGuilds, setNonBotGuilds] = useState([]);
  const [botInviteUrl, setBotInviteUrl] = useState('');
  const [guildsLoading, setGuildsLoading] = useState(false);

  const [sourceGuild, setSourceGuild] = useState(null);
  const [targetGuild, setTargetGuild] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data.authenticated) {
        setUser(res.data.user);
        setLicense(res.data.license || null);
        setIsAdmin(!!res.data.isAdmin);
        setBotInviteUrl(res.data.botInviteUrl || '');
      } else {
        setUser(null);
        setLicense(null);
        setIsAdmin(false);
      }
    } catch (err) {
      setUser(null);
      setLicense(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const redeemKey = async (keyString) => {
    try {
      const res = await axios.post('/api/auth/redeem', { key: keyString });
      if (res.data.success) {
        setLicense(res.data.license);
        return { success: true };
      }
      return { success: false, error: res.data.error || 'Failed to redeem key.' };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Invalid key.' };
    }
  };

  const fetchGuilds = async () => {
    setGuildsLoading(true);
    try {
      const res = await axios.get('/api/guilds');
      setMutualGuilds(res.data.mutualGuilds || []);
      setNonBotGuilds(res.data.nonBotGuilds || []);
      if (res.data.botInviteUrl) {
        setBotInviteUrl(res.data.botInviteUrl);
      }
      if (res.data.mutualGuilds?.length > 0) {
        if (!sourceGuild) setSourceGuild(res.data.mutualGuilds[0]);
        if (!targetGuild && res.data.mutualGuilds.length > 1) {
          setTargetGuild(res.data.mutualGuilds[1]);
        }
      }
    } catch (err) {
      console.error('Failed to load guilds:', err);
    } finally {
      setGuildsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (_) {}
    setUser(null);
    setLicense(null);
    setIsAdmin(false);
    window.location.href = '/';
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && license?.active) {
      fetchGuilds();
    }
  }, [user, license]);

  return (
    <AuthContext.Provider
      value={{
        user,
        license,
        isAdmin,
        loading,
        redeemKey,
        refreshAuth: fetchUser,
        mutualGuilds,
        nonBotGuilds,
        guildsLoading,
        sourceGuild,
        setSourceGuild,
        targetGuild,
        setTargetGuild,
        botInviteUrl,
        fetchGuilds,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
