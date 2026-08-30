import React from 'react';
import { Bot, Activity, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar({ onOpenGuide }) {
  const { mutualGuilds, sourceGuild, targetGuild } = useAuth();

  return (
    <header className="h-14 bg-[#1e1f22]/90 backdrop-blur border-b border-[#2b2d31] px-6 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#2b2d31] text-xs font-medium text-[#dbdee1] border border-[#35373c]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Gateway: Online</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-discord-textMuted font-mono">
          <Activity className="w-3.5 h-3.5 text-[#5865F2]" />
          <span>Ping: ~24ms</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {sourceGuild && targetGuild && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#2b2d31] rounded-lg border border-[#35373c] text-xs">
            <span className="text-discord-textMuted">Active Target:</span>
            <span className="font-semibold text-white flex items-center gap-1">
              {targetGuild.name}
            </span>
          </div>
        )}

        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] transition-all border border-[#35373c]"
        >
          <span>Docs & Permissions</span>
          <ExternalLink className="w-3 h-3 text-discord-textMuted" />
        </button>
      </div>
    </header>
  );
}
