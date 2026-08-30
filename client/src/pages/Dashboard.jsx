import React from 'react';
import {
  Server,
  Users,
  ShieldCheck,
  Copy,
  Layers,
  MessageSquareShare,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Dashboard({ onNavigate }) {
  const { user, mutualGuilds, nonBotGuilds, botInviteUrl } = useAuth();

  const stats = [
    {
      title: 'Accessible Guilds',
      value: mutualGuilds.length,
      icon: Server,
      color: 'from-blue-500/20 to-indigo-500/20',
      textColor: 'text-blue-400',
    },
    {
      title: 'Bot Presence',
      value: `${mutualGuilds.length} Servers`,
      icon: ShieldCheck,
      color: 'from-emerald-500/20 to-teal-500/20',
      textColor: 'text-emerald-400',
    },
    {
      title: 'Unlinked Guilds',
      value: nonBotGuilds.length,
      icon: Users,
      color: 'from-amber-500/20 to-orange-500/20',
      textColor: 'text-amber-400',
    },
    {
      title: 'Cloning Engine',
      value: 'v14.17 (Ready)',
      icon: Sparkles,
      color: 'from-purple-500/20 to-pink-500/20',
      textColor: 'text-purple-400',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#3c45a5] p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>High Fidelity Discord Synchronization</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.global_name || user?.username || 'hyperionlarp'}!
          </h1>
          <p className="text-white/80 text-sm leading-relaxed">
            Clone complete Discord server architectures including hierarchy roles, categorized channels, custom emojis, permissions overwrites, and message history with one click.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('clone')}
              className="px-5 py-2.5 rounded-xl bg-white text-[#5865F2] font-bold text-sm hover:bg-slate-100 transition-all shadow-md flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              <span>Clone a Server</span>
            </button>
            <button
              onClick={() => onNavigate('messages')}
              className="px-5 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 text-white font-medium text-sm transition-all border border-white/20 flex items-center gap-2"
            >
              <MessageSquareShare className="w-4 h-4" />
              <span>Clone Messages</span>
            </button>
          </div>
        </div>
        <div className="absolute right-[-20px] bottom-[-40px] opacity-10 pointer-events-none hidden lg:block">
          <Server className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-[#2b2d31] border border-[#35373c] rounded-xl p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-discord-textMuted uppercase tracking-wider">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Servers Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Your Managed Discord Servers</h2>
            <p className="text-xs text-discord-textMuted">
              Select or invite your bot to servers where you have Administrator permissions
            </p>
          </div>
          {botInviteUrl && (
            <a
              href={botInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#5865F2] hover:text-[#7983f5] flex items-center gap-1"
            >
              <span>Authorize bot on more servers</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mutualGuilds.map((g) => (
            <div
              key={g.id}
              className="bg-[#2b2d31] border border-[#35373c] hover:border-[#5865F2]/60 rounded-xl p-4 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-start gap-3">
                {g.icon ? (
                  <img src={g.icon} alt={g.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#35373c]" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#1e1f22] flex items-center justify-center font-bold text-white text-base ring-2 ring-[#35373c]">
                    {g.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-white text-sm truncate group-hover:text-[#5865F2] transition-colors">
                    {g.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Bot Linked
                  </span>
                  <div className="flex items-center gap-3 mt-2 text-xs text-discord-textMuted">
                    <span>{g.rolesCount || 0} Roles</span>
                    <span>•</span>
                    <span>{g.channelsCount || 0} Channels</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#35373c] flex items-center justify-end">
                <button
                  onClick={() => onNavigate('clone')}
                  className="text-xs font-semibold text-[#5865F2] group-hover:text-white group-hover:bg-[#5865F2] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                >
                  <span>Use in Cloner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Non bot guilds */}
          {nonBotGuilds.map((g) => (
            <div
              key={g.id}
              className="bg-[#2b2d31]/50 border border-dashed border-[#35373c] rounded-xl p-4 flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                {g.icon ? (
                  <img src={g.icon} alt={g.name} className="w-12 h-12 rounded-xl object-cover opacity-60" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#1e1f22] flex items-center justify-center font-bold text-white/50 text-base">
                    {g.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-semibold text-[#dbdee1] text-sm truncate">{g.name}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Needs Bot Invite
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#35373c] flex items-center justify-end">
                <a
                  href={g.inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Invite Bot</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
