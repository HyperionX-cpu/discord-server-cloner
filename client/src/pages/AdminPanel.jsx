import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Key, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  UserX, 
  Check, 
  Copy, 
  Clock, 
  Sparkles, 
  RefreshCw,
  Search,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CustomSelect } from '../components/CustomSelect';

export function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('keys');
  const [keys, setKeys] = useState([]);
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Key generator form
  const [duration, setDuration] = useState('30d');
  const [amount, setAmount] = useState(1);
  const [prefix, setPrefix] = useState('VEIL');
  const [note, setNote] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);

  // Ban user form
  const [banDiscordId, setBanDiscordId] = useState('');
  const [banReason, setBanReason] = useState('');

  const fetchKeys = async () => {
    try {
      const res = await axios.get('/api/admin/keys');
      setKeys(res.data.keys || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBans = async () => {
    try {
      const res = await axios.get('/api/admin/bans');
      setBans(res.data.bans || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchBans();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/keys/generate', {
        duration,
        amount,
        prefix,
        note
      });
      if (res.data.success) {
        setGeneratedKeys(res.data.keys);
        fetchKeys();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate keys');
    }
    setLoading(false);
  };

  const handleDeleteKey = async (key) => {
    if (!confirm(`Delete key ${key}? This will revoke access for any redeemed user.`)) return;
    try {
      await axios.delete(`/api/admin/keys/${key}`);
      fetchKeys();
    } catch (err) {
      alert('Failed to delete key');
    }
  };

  const handleBanUser = async (e) => {
    e.preventDefault();
    if (!banDiscordId.trim()) return;
    try {
      await axios.post('/api/admin/bans', {
        discordId: banDiscordId.trim(),
        reason: banReason.trim()
      });
      setBanDiscordId('');
      setBanReason('');
      fetchBans();
      fetchKeys();
      alert('User banned and license revoked.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to ban user');
    }
  };

  const handleUnban = async (id) => {
    try {
      await axios.delete(`/api/admin/bans/${id}`);
      fetchBans();
    } catch (err) {
      alert('Failed to unban user');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-white">
      {/* Header */}
      <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-white">
              Veil Cloner Admin Console
            </h1>
            <p className="text-xs text-zinc-400">
              Generate license keys, manage user subscriptions, and handle blacklist bans.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'keys' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Key Manager ({keys.length})
          </button>
          <button
            onClick={() => setActiveTab('bans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'bans' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Blacklist / Bans ({bans.length})
          </button>
        </div>
      </div>

      {activeTab === 'keys' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Key Generator Card */}
          <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5 h-fit">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-white" />
              Generate License Keys
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Duration</label>
                <CustomSelect
                  value={duration}
                  onChange={(val) => setDuration(val)}
                  options={[
                    { value: '1d', label: '1 Day Key (24 Hours)' },
                    { value: '7d', label: '7 Days Key (1 Week)' },
                    { value: '30d', label: '30 Days Key (1 Month)' },
                    { value: '90d', label: '90 Days Key (3 Months)' },
                    { value: 'lifetime', label: 'Lifetime Access (Permanent)' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="VEIL"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Customer / Note</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Buyer Discord or Order #104"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? 'Generating...' : 'Generate Key(s)'}
              </button>
            </form>

            {/* Generated output */}
            {generatedKeys.length > 0 && (
              <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase text-emerald-400">
                  <span>Generated ({generatedKeys.length})</span>
                  <button 
                    onClick={() => copyToClipboard(generatedKeys.map(k => k.key).join('\n'))}
                    className="hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy All
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-xs text-zinc-200">
                  {generatedKeys.map((k) => (
                    <div key={k.key} className="flex items-center justify-between p-2 bg-black/60 rounded-lg">
                      <span className="truncate">{k.key}</span>
                      <button onClick={() => copyToClipboard(k.key)} className="text-zinc-400 hover:text-white p-1">
                        {copiedKey === k.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Keys Table */}
          <div className="lg:col-span-2 bg-[#121215] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                All Keys ({keys.length})
              </h2>
              <button 
                onClick={fetchKeys}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/60 text-zinc-400 uppercase font-bold border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">License Key</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Status / User</th>
                    <th className="py-3 px-4">Expires</th>
                    <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {keys.map((k) => (
                    <tr key={k.key} className="hover:bg-zinc-900/40 transition font-mono">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{k.key}</span>
                          <button onClick={() => copyToClipboard(k.key)} className="text-zinc-500 hover:text-white">
                            {copiedKey === k.key ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        {k.note && <p className="text-[10px] text-zinc-500 font-sans">{k.note}</p>}
                      </td>
                      <td className="py-3 px-4 uppercase text-zinc-300 font-sans font-semibold">
                        {k.duration}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        {k.claimedBy ? (
                          <span className="px-2.5 py-1 bg-white/10 text-white rounded-lg text-[11px] font-bold border border-white/20">
                            @{k.claimedUsername || k.claimedBy}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/20">
                            Unclaimed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-sans text-[11px]">
                        {k.duration === 'lifetime' ? 'Never' : (k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'Pending Activation')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteKey(k.key)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Revoke / Delete Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bans' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ban form */}
          <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5 h-fit">
            <h2 className="text-sm font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
              <UserX className="w-4 h-4" />
              Blacklist / Ban User
            </h2>

            <form onSubmit={handleBanUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Discord User ID</label>
                <input
                  type="text"
                  required
                  value={banDiscordId}
                  onChange={(e) => setBanDiscordId(e.target.value)}
                  placeholder="e.g. 1240169071287205950"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Reason</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Chargeback, sharing keys, etc."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-red-600/20"
              >
                Ban User & Revoke Key
              </button>
            </form>
          </div>

          {/* Banned Users Table */}
          <div className="lg:col-span-2 bg-[#121215] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Banned Accounts ({bans.length})
            </h2>

            {bans.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No accounts currently blacklisted.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/60 text-zinc-400 uppercase font-bold border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Discord ID</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Banned At</th>
                      <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {bans.map((b) => (
                      <tr key={b.discordId} className="hover:bg-zinc-900/40 transition font-mono">
                        <td className="py-3 px-4 text-white font-bold">{b.discordId}</td>
                        <td className="py-3 px-4 text-red-400 font-sans">{b.reason}</td>
                        <td className="py-3 px-4 text-zinc-400 font-sans text-[11px]">
                          {new Date(b.bannedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <button
                            onClick={() => handleUnban(b.discordId)}
                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold"
                          >
                            Unban
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
