import React from 'react';
import {
  BookOpen,
  Key,
  Shield,
  Bot,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Guide() {
  const { botInviteUrl } = useAuth();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Discord Cloner Setup & Deployment Guide</h1>
        <p className="text-sm text-discord-textMuted mt-1">
          Complete instructions for setting up your Discord Application, Bot Token, OAuth2 credentials, and role hierarchies.
        </p>
      </div>

      {/* Step by Step Cards */}
      <div className="space-y-6">
        {/* Step 1: Create App */}
        <div className="bg-[#2b2d31] border border-[#35373c] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center font-bold text-white text-sm">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create Discord Developer Application</h2>
              <p className="text-xs text-discord-textMuted">Register your bot application in Discord Developer Portal</p>
            </div>
          </div>

          <div className="bg-[#1e1f22] p-4 rounded-xl space-y-3 text-xs text-[#dbdee1]">
            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>
                Navigate to the{' '}
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5865F2] font-semibold underline inline-flex items-center gap-1"
                >
                  Discord Developer Portal <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Click <strong>New Application</strong> and give it a name (e.g. <code>Server Cloner Bot</code>).</li>
              <li>Go to the <strong>Bot</strong> tab and click <strong>Add Bot</strong> (or Reset Token to reveal your token).</li>
              <li>
                Under <strong>Privileged Gateway Intents</strong>, make sure to <strong>ENABLE</strong> all three:
                <ul className="list-disc list-inside ml-4 mt-1 font-semibold text-emerald-400">
                  <li>PRESENCE INTENT</li>
                  <li>SERVER MEMBERS INTENT</li>
                  <li>MESSAGE CONTENT INTENT</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>

        {/* Step 2: Configure .env */}
        <div className="bg-[#2b2d31] border border-[#35373c] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center font-bold text-white text-sm">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configure Environment Variables (.env)</h2>
              <p className="text-xs text-discord-textMuted">Save credentials into your root <code>.env</code> file</p>
            </div>
          </div>

          <div className="bg-[#111214] p-4 rounded-xl font-mono text-xs text-emerald-300 border border-[#35373c]">
            <pre className="overflow-x-auto">{`# Server Configuration
PORT=4000
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your_super_secret_session_key

# Discord Bot & OAuth2 Credentials
DISCORD_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
DISCORD_CLIENT_ID=YOUR_APPLICATION_CLIENT_ID
DISCORD_CLIENT_SECRET=YOUR_APPLICATION_CLIENT_SECRET
DISCORD_REDIRECT_URI=http://localhost:4000/api/auth/callback`}</pre>
          </div>
        </div>

        {/* Step 3: Bot Permissions & Hierarchy */}
        <div className="bg-[#2b2d31] border border-[#35373c] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center font-bold text-white text-sm">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Bot Roles & Server Hierarchy</h2>
              <p className="text-xs text-discord-textMuted">Crucial step for cloning roles and channel permissions</p>
            </div>
          </div>

          <div className="bg-[#1e1f22] p-4 rounded-xl space-y-3 text-xs text-[#dbdee1]">
            <div className="flex items-start gap-2 text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Important:</strong> On your target Discord server, go to <strong>Server Settings &gt; Roles</strong> and drag the bot's role to the <strong>very top</strong> of the role hierarchy. Discord will not let a bot create or manage roles positioned higher than its own role.
              </span>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-white">Required Permissions:</p>
              <ul className="list-disc list-inside space-y-1 text-discord-textMuted">
                <li><code className="text-white">Administrator</code> (Recommended for full cloning)</li>
                <li><code className="text-white">Manage Roles</code></li>
                <li><code className="text-white">Manage Channels</code></li>
                <li><code className="text-white">Manage Webhooks</code> (for cloning message history with original authors)</li>
                <li><code className="text-white">Manage Emojis and Stickers</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
