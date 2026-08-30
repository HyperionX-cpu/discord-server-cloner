import React, { useState } from 'react';
import { Key, ShieldAlert, CheckCircle2, Lock, ArrowRight, Sparkles, LogOut, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LicenseGate() {
  const { user, license, redeemKey, logout } = useAuth();
  const [keyInput, setKeyInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setError('');
    setSubmitting(true);

    const res = await redeemKey(keyInput.trim());
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setError(res.error || 'Invalid or expired license key.');
    }
    setSubmitting(false);
  };

  if (license?.banned) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121215] border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-red-400">Account Banned</h2>
          <p className="text-sm text-zinc-400">
            Your Discord account has been suspended from accessing Veil Cloner.
          </p>
          <div className="p-3 bg-black/50 border border-red-500/20 rounded-xl text-xs text-red-300 font-mono">
            Reason: {license.reason || 'Term violation'}
          </div>
          <button
            onClick={logout}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4 selection:bg-white selection:text-black">
      <div className="max-w-lg w-full bg-[#121215] border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto shadow-inner text-white">
            <Key className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            Veil Cloner Activation
          </h1>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {license?.expired 
              ? 'Your license subscription has expired. Please enter a new key to resume access.'
              : 'Enter your Veil Cloner license key to link access to your Discord account.'}
          </p>
        </div>

        {/* Authenticated User Badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src={user?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
              alt={user?.username} 
              className="w-9 h-9 rounded-full bg-zinc-800 object-cover border border-zinc-700"
            />
            <div className="overflow-hidden text-left">
              <p className="text-xs font-bold text-white truncate">{user?.global_name || user?.username}</p>
              <p className="text-[10px] text-zinc-500 font-mono">@{user?.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Switch Discord Account"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch</span>
          </button>
        </div>

        {/* Key Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 text-left">
              License Key
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="VEIL-XXXX-XXXX-XXXX"
                className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-700 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-white font-mono text-sm uppercase tracking-widest text-center shadow-inner transition"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-white/10 border border-white/30 rounded-xl text-xs text-white text-center font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>License verified! Redirecting to Veil Cloner...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || success}
            className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg hover:shadow-white/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? 'Verifying Key...' : 'Activate License'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Info */}
        <div className="pt-2 border-t border-zinc-900 text-center">
          <p className="text-[11px] text-zinc-500">
            Keys are permanently locked to this Discord ID until expiration.
          </p>
        </div>
      </div>
    </div>
  );
}
