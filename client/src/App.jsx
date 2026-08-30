import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { CloneServer } from './pages/CloneServer';
import { CloneMessages } from './pages/CloneMessages';
import { Guide } from './pages/Guide';

function MainApp() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#1e1f22] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-discord-textMuted font-mono">Initializing Discord Cloner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#1e1f22] text-[#dbdee1] overflow-hidden">
      {/* Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar onOpenGuide={() => setCurrentTab('guide')} />

        <main className="flex-1 overflow-y-auto bg-[#313338]/30">
          {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
          {currentTab === 'clone' && <CloneServer />}
          {currentTab === 'messages' && <CloneMessages />}
          {currentTab === 'guide' && <Guide />}
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
