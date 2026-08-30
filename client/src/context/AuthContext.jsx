import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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
        setBotInviteUrl(res.data.botInviteUrl || '');
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Auth check failed:', err.message);
      // Fallback demo user for local convenience
      setUser({
        id: '123456789012345678',
        username: 'hyperionlarp',
        discriminator: '0',
        global_name: 'hyperionlarp',
        avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
        isDemo: true,
      });
    } finally {
      setLoading(false);
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
    window.location.reload();
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchGuilds();
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        mutualGuilds,
        nonBotGuilds,
        botInviteUrl,
        guildsLoading,
        fetchGuilds,
        logout,
        sourceGuild,
        setSourceGuild,
        targetGuild,
        setTargetGuild,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
