import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LicenseGate } from './components/LicenseGate';
import { Dashboard } from './pages/Dashboard';
import { CloneServer } from './pages/CloneServer';
import { CloneMessages } from './pages/CloneMessages';
import { Guide } from './pages/Guide';
import { AdminPanel } from './pages/AdminPanel';
import { Lock, Sparkles } from 'lucide-react';

function LoginPrompt() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4 selection:bg-white selection:text-black">
      <div className="max-w-md w-full bg-[#121215] border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

        <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center mx-auto shadow-xl font-black text-2xl">
          V
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight uppercase text-white">
            Veil's Cloner
          </h1>
          <p className="text-xs text-zinc-400">
            Professional Discord Server & Message Replication Suite
          </p>
        </div>

        <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-left space-y-2 text-xs text-zinc-300">
          <div className="flex items-center gap-2 text-white font-bold">
            <Sparkles className="w-4 h-4 text-white" />
            <span>Authentication Protocol</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Please authenticate using your Discord account. You will be prompted for your Veil license key on first access.
          </p>
        </div>

        <a
          href="/api/auth/login"
          className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl hover:shadow-white/10 flex items-center justify-center gap-2"
        >
          <span>Sign In with Discord</span>
        </a>

        <p className="text-[10px] text-zinc-600 font-mono">
          Protected by Veil Security Systems • © 2026
        </p>
      </div>
    </div>
  );
}

function MainApp() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { user, license, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Loading Veil Cloner...</p>
        </div>
      </div>
    );
  }

  // 1. Not signed in to Discord -> Show Login screen
  if (!user) {
    return <LoginPrompt />;
  }

  // 2. Signed in, but no active key / expired / banned -> Show License Gate
  if (!license?.active) {
    return <LicenseGate />;
  }

  // 3. Authenticated and Licensed -> Show Full Dashboard
  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-zinc-200 overflow-hidden selection:bg-white selection:text-black">
      {/* Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar onOpenGuide={() => setCurrentTab('guide')} />

        <main className="flex-1 overflow-y-auto bg-[#0d0e11]/80">
          {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
          {currentTab === 'clone' && <CloneServer />}
          {currentTab === 'messages' && <CloneMessages />}
          {currentTab === 'admin' && isAdmin && <AdminPanel />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
