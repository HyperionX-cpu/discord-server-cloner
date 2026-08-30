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
  Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ currentTab, setCurrentTab }) {
  const { user, logout, fetchGuilds, guildsLoading, botInviteUrl } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clone', label: 'Clone Server', icon: Copy },
    { id: 'messages', label: 'Clone Messages', icon: MessageSquareShare },
    { id: 'guide', label: 'Setup Guide', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-[#1e1f22] border-r border-[#2b2d31] flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#2b2d31] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center shadow-lg shadow-[#5865F2]/20">
          <Server className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-base leading-tight">
            Discord Cloner
          </h1>
          <span className="text-[11px] text-discord-textMuted font-medium uppercase tracking-wider">
            Server & Messages
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-[#80848e] tracking-wider uppercase">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/30 font-semibold'
                  : 'text-discord-textMuted hover:text-discord-textHeader hover:bg-[#2b2d31]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-discord-textMuted'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-5 px-3 pb-2 text-[11px] font-bold text-[#80848e] tracking-wider uppercase">
          Bot Management
        </div>

        <button
          onClick={fetchGuilds}
          disabled={guildsLoading}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-discord-textMuted hover:text-discord-textHeader hover:bg-[#2b2d31] transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${guildsLoading ? 'animate-spin text-[#5865F2]' : ''}`} />
          <span>Refresh Servers</span>
        </button>

        {botInviteUrl && (
          <a
            href={botInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all border border-emerald-500/20 mt-1"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Invite Bot to Server
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        )}
      </nav>

      {/* Footer User Card */}
      <div className="p-3 border-t border-[#2b2d31] bg-[#18191c]">
        {user ? (
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#2b2d31]/70 border border-[#35373c]/50">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt={user.username}
                className="w-9 h-9 rounded-full bg-[#1e1f22] object-cover ring-2 ring-[#5865F2]/40 shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {user.global_name || user.username || 'hyperionlarp'}
                </p>
                <p className="text-[11px] text-[#949ba4] truncate font-mono">
                  @{user.username || 'hyperionlarp'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-discord-textMuted hover:text-discord-red hover:bg-[#35373c] rounded-md transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <a
            href="/api/auth/login"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-xs rounded-lg transition-colors shadow-md"
          >
            <span>Log In with Discord</span>
          </a>
        )}
      </div>
    </aside>
  );
}
