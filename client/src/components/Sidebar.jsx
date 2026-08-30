import React from 'react';
import {
  LayoutDashboard,
  Copy,
  MessageSquareShare,
  BookOpen,
  RefreshCw,
  LogOut,
  ExternalLink,
  ShieldAlert,
  Server,
  Lock,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ currentTab, setCurrentTab }) {
  const { user, license, isAdmin, logout, fetchGuilds, guildsLoading, botInviteUrl } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clone', label: 'Clone Server', icon: Copy },
    { id: 'messages', label: 'Clone Messages', icon: MessageSquareShare },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Console', icon: Lock });
  }

  return (
    <aside className="w-64 bg-[#121215] border-r border-zinc-800/80 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-lg font-black text-lg">
          V
        </div>
        <div>
          <h1 className="font-black text-white tracking-wide text-sm leading-tight uppercase">
            Veil's Cloner
          </h1>
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
            {license?.isOwner ? 'OWNER OVERRIDE' : `PLAN: ${(license?.duration || 'LIFETIME').toUpperCase()}`}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-black text-zinc-500 tracking-widest uppercase">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-black shadow-md font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[10px] font-black text-zinc-500 tracking-widest uppercase">
          Bot Controls
        </div>
        <button
          onClick={fetchGuilds}
          disabled={guildsLoading}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${guildsLoading ? 'animate-spin text-white' : ''}`} />
          <span>Refresh Servers</span>
        </button>

        {botInviteUrl && (
          <a
            href={botInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all border border-zinc-800 mt-1"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Invite Bot
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        )}
      </nav>

      {/* Footer User Card */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#09090b]">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
              alt={user?.username}
              className="w-8 h-8 rounded-full bg-zinc-800 object-cover border border-zinc-700 shrink-0"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">
                {user?.global_name || user?.username}
              </p>
              <p className="text-[10px] text-zinc-500 truncate font-mono">
                @{user?.username}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
