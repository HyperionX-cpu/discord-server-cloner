import React from 'react';
import {
  Server,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Plus,
  Key,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Dashboard({ onNavigate }) {
  const { user, license, mutualGuilds, nonBotGuilds, botInviteUrl } = useAuth();

  const stats = [
    {
      title: 'Accessible Servers',
      value: mutualGuilds.length,
      icon: Server,
      sub: 'Manage/Admin Servers',
    },
    {
      title: 'Bot Synchronized',
      value: `${mutualGuilds.length} Guilds`,
      icon: ShieldCheck,
      sub: 'Ready for Replication',
    },
    {
      title: 'Unlinked Servers',
      value: nonBotGuilds.length,
      icon: Users,
      sub: 'Click to Add Bot',
    },
    {
      title: 'Active License',
      value: (license?.duration || 'LIFETIME').toUpperCase(),
      icon: Key,
      sub: license?.expiresAt ? `Until ${new Date(license.expiresAt).toLocaleDateString()}` : 'Permanent Access',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-white">
      {/* Welcome Banner (Clean Black & White Monochrome) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-[#141418] to-black border border-zinc-800 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Veil Core Cloning Protocol</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">
            Welcome, {user ? (user.global_name || user.username) : 'Member'}
          </h1>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-lg">
            High-speed, granular Discord replication engine. Replicate entire server hierarchies, permission overwrites, roles, categories, and channels with zero loss.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => onNavigate('clone')}
              className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <span>Start Cloning</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[#121215] border border-zinc-800 shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{stat.title}</span>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <p className="text-[10px] text-zinc-500 font-mono">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Synchronized Servers Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Synchronized Servers ({mutualGuilds.length})
          </h2>
          {botInviteUrl && (
            <a
              href={botInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-white font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Invite Bot to Another Server
            </a>
          )}
        </div>

        {mutualGuilds.length === 0 ? (
          <div className="p-12 text-center bg-[#121215] border border-zinc-800/80 rounded-3xl space-y-3">
            <Server className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Synchronized Servers</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Add the Veil Bot to any server below where you have Administrator or Manage Server permissions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mutualGuilds.map((g) => (
              <div
                key={g.id}
                className="p-4 rounded-2xl bg-[#121215] border border-zinc-800 hover:border-zinc-600 transition flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {g.icon ? (
                    <img src={g.icon} alt={g.name} className="w-10 h-10 rounded-xl object-cover border border-zinc-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                      {g.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{g.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{g.channelsCount || 0} channels • {g.rolesCount || 0} roles</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('clone')}
                  className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider rounded-xl transition shadow-md"
                >
                  Clone
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unlinked Servers (Servers user owns/admins but bot is not in yet) */}
      {nonBotGuilds.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-500" />
                Your Other Admin Servers ({nonBotGuilds.length})
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Servers you manage where Veil Bot is not invited yet. Click "Add Bot" to link.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonBotGuilds.map((g) => (
              <div
                key={g.id}
                className="p-4 rounded-2xl bg-[#121215]/80 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {g.icon ? (
                    <img src={g.icon} alt={g.name} className="w-10 h-10 rounded-xl object-cover border border-zinc-800 opacity-80" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">
                      {g.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-zinc-300 truncate">{g.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Bot Not Added</p>
                  </div>
                </div>

                <a
                  href={g.inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bot</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
