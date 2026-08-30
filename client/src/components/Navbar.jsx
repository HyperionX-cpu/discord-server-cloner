import React from 'react';
import { Bot, Activity, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar({ onOpenGuide }) {
  const { mutualGuilds, sourceGuild, targetGuild, license } = useAuth();

  return (
    <header className="h-14 bg-[#121215]/95 backdrop-blur border-b border-zinc-800/80 px-6 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 text-xs font-medium text-zinc-300 border border-zinc-800">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">Veil Gateway: Online</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
          <Activity className="w-3.5 h-3.5 text-zinc-400" />
          <span>Ping: 22ms</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {sourceGuild && targetGuild && (
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-500">Target:</span>
            <span className="font-semibold text-white truncate max-w-[180px]">
              {targetGuild.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
