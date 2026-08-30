import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  ArrowRight,
  Server,
  Layers,
  Hash,
  Smile,
  MessageSquare,
  Trash2,
  Settings2,
  CheckCircle,
  AlertTriangle,
  Play,
  Check,
  ChevronDown,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CloneLogs } from '../components/CloneLogs';
import { CustomSelect } from '../components/CustomSelect';

export function CloneServer() {
  const { mutualGuilds, sourceGuild, setSourceGuild, targetGuild, setTargetGuild } = useAuth();

  // Source Guild Details
  const [sourceDetails, setSourceDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Cloning Options
  const [cloneSettings, setCloneSettings] = useState({
    name: true,
    icon: true,
    banner: true,
    verification: true,
  });

  const [clearTarget, setClearTarget] = useState(true);
  const [clearOptions, setClearOptions] = useState({
    channels: true,
    roles: true,
    emojis: false,
    stickers: false,
    icon: false,
    banner: false,
  });

  const [rolesMode, setRolesMode] = useState('all'); // all | custom
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);

  const [channelsMode, setChannelsMode] = useState('all'); // all | custom
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [isChannelsModalOpen, setIsChannelsModalOpen] = useState(false);

  const [cloneEmojis, setCloneEmojis] = useState(true);
  const [cloneStickers, setCloneStickers] = useState(true);

  const [messagesEnabled, setMessagesEnabled] = useState(false);
  const [messageLimit, setMessageLimit] = useState(25);
  const [cloneAttachments, setCloneAttachments] = useState(true);

  // Execution & Logs
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState('idle'); // idle | running | completed | failed | stopped
  const [logs, setLogs] = useState([]);
  const [confirmModal, setConfirmModal] = useState(false);

  // Fetch source details when sourceGuild changes
  useEffect(() => {
    if (!sourceGuild?.id) return;
    setLoadingDetails(true);
    axios
      .get(`/api/guilds/${sourceGuild.id}/details`)
      .then((res) => {
        setSourceDetails(res.data);
        if (res.data.roles) {
          setSelectedRoles(res.data.roles.map((r) => r.id));
        }
        if (res.data.categories) {
          const allChIds = [];
          res.data.categories.forEach((cat) => {
            if (cat.id !== 'uncategorized') allChIds.push(cat.id);
            cat.channels.forEach((c) => allChIds.push(c.id));
          });
          setSelectedChannels(allChIds);
        }
      })
      .catch((err) => console.error('Failed to load guild details:', err))
      .finally(() => setLoadingDetails(false));
  }, [sourceGuild]);

  // Connect SSE for Logs
  useEffect(() => {
    if (!activeJobId) return;

    const eventSource = new EventSource(`/api/clone/logs/${activeJobId}`);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'init') {
          setLogs(data.logs || []);
          if (data.status) setJobStatus(data.status);
        } else if (data.type === 'log') {
          setLogs((prev) => [...prev, data.log]);
        } else if (data.type === 'status') {
          setJobStatus(data.status);
          if (data.status === 'completed' || data.status === 'failed' || data.status === 'stopped') {
            eventSource.close();
          }
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [activeJobId]);

  const handleStartClone = async () => {
    setConfirmModal(false);
    if (!sourceGuild || !targetGuild) {
      alert('Please select both a Source and a Target Discord Server.');
      return;
    }
    if (sourceGuild.id === targetGuild.id) {
      alert('Source and Target servers cannot be identical.');
      return;
    }

    setJobStatus('running');
    setLogs([]);

    try {
      const payload = {
        sourceGuildId: sourceGuild.id,
        targetGuildId: targetGuild.id,
        options: {
          cloneName: cloneSettings.name,
          cloneIcon: cloneSettings.icon,
          cloneBanner: cloneSettings.banner,
          cloneVerification: cloneSettings.verification,
          clearTarget,
          clearTargetOptions: clearOptions,
          roles: {
            mode: rolesMode,
            roleIds: selectedRoles,
          },
          channels: {
            mode: channelsMode,
            channelIds: selectedChannels,
          },
          cloneEmojis,
          cloneStickers,
          messages: {
            enabled: messagesEnabled,
            limitPerChannel: messageLimit,
            cloneAttachments,
          },
        },
      };

      const res = await axios.post('/api/clone/start', payload);
      setActiveJobId(res.data.jobId);
    } catch (err) {
      setJobStatus('failed');
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString(),
          type: 'error',
          message: `Failed to initiate clone: ${err.response?.data?.error || err.message}`,
        },
      ]);
    }
  };

  const handleStopClone = async () => {
    if (!activeJobId) return;
    try {
      await axios.post(`/api/clone/stop/${activeJobId}`);
      setJobStatus('stopped');
    } catch (err) {
      console.error('Failed to stop job:', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-white">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Full Server Cloner</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure replication options, select custom roles & channels, and execute high-speed synchronization.
        </p>
      </div>

      {/* Server Selector Bar */}
      <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* Source Server */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              Source Server (Copy From)
            </label>
            <CustomSelect
              value={sourceGuild?.id || ''}
              onChange={(val) => {
                const g = mutualGuilds.find((item) => item.id === val);
                setSourceGuild(g || null);
              }}
              options={mutualGuilds.map((g) => ({
                value: g.id,
                label: `${g.name} (${g.rolesCount || 0} roles, ${g.channelsCount || 0} channels)`,
              }))}
              placeholder="Select Source Server"
            />
          </div>

          {/* Arrow Divider */}
          <div className="md:col-span-1 flex justify-center pt-4 md:pt-6">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-inner">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Target Server */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              Target Server (Clone Into)
            </label>
            <CustomSelect
              value={targetGuild?.id || ''}
              onChange={(val) => {
                const g = mutualGuilds.find((item) => item.id === val);
                setTargetGuild(g || null);
              }}
              options={mutualGuilds.map((g) => ({
                value: g.id,
                label: g.name,
              }))}
              placeholder="Select Target Server"
            />
          </div>
        </div>
      </div>

      {/* Main Cloning Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settings, Clear Target, Emojis */}
        <div className="space-y-6">
          {/* Server Identity / Branding */}
          <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-zinc-800 pb-3 uppercase tracking-wider">
              <Settings2 className="w-4 h-4 text-white" />
              <span>Server Identity & Branding</span>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'name', label: 'Server Name' },
                { key: 'icon', label: 'Server Icon / Avatar' },
                { key: 'banner', label: 'Server Banner' },
                { key: 'verification', label: 'Verification Level' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer text-xs font-semibold transition"
                >
                  <span className="text-zinc-200">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={cloneSettings[item.key]}
                    onChange={(e) =>
                      setCloneSettings((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-white focus:ring-0 cursor-pointer accent-white"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Target Cleanup Section */}
          <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                <Trash2 className="w-4 h-4 text-white" />
                <span>Target Server Cleanup</span>
              </div>
              <input
                type="checkbox"
                checked={clearTarget}
                onChange={(e) => setClearTarget(e.target.checked)}
                className="w-4 h-4 rounded text-white focus:ring-0 cursor-pointer accent-white"
              />
            </div>

            {clearTarget && (
              <div className="space-y-2 text-xs">
                <p className="text-zinc-400 text-xs flex items-center gap-1.5 mb-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-white" />
                  Existing elements on target server will be deleted prior to cloning.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'channels', label: 'Purge Channels' },
                    { key: 'roles', label: 'Purge Roles' },
                    { key: 'emojis', label: 'Purge Emojis' },
                    { key: 'stickers', label: 'Purge Stickers' },
                  ].map((c) => (
                    <label
                      key={c.key}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs cursor-pointer font-semibold"
                    >
                      <input
                        type="checkbox"
                        checked={clearOptions[c.key]}
                        onChange={(e) =>
                          setClearOptions((prev) => ({ ...prev, [c.key]: e.target.checked }))
                        }
                        className="rounded text-white focus:ring-0 cursor-pointer accent-white"
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Emojis & Stickers */}
          <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-zinc-800 pb-3 uppercase tracking-wider">
              <Smile className="w-4 h-4 text-white" />
              <span>Emojis & Stickers</span>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs cursor-pointer">
                <div>
                  <span className="text-zinc-200 font-semibold block">Custom Emojis</span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {sourceDetails?.emojisCount || 0} emojis in source server
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={cloneEmojis}
                  onChange={(e) => setCloneEmojis(e.target.checked)}
                  className="w-4 h-4 rounded text-white focus:ring-0 cursor-pointer accent-white"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs cursor-pointer">
                <div>
                  <span className="text-zinc-200 font-semibold block">Custom Stickers</span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {sourceDetails?.stickersCount || 0} stickers in source server
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={cloneStickers}
                  onChange={(e) => setCloneStickers(e.target.checked)}
                  className="w-4 h-4 rounded text-white focus:ring-0 cursor-pointer accent-white"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Center / Right Columns: Roles, Channels, Messages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Roles Configuration */}
          <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                <Layers className="w-4 h-4 text-white" />
                <span>Roles Hierarchy & Permissions</span>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {sourceDetails?.roles?.length || 0} Roles Available
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setRolesMode('all')}
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  rolesMode === 'all'
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                Clone All Roles ({sourceDetails?.roles?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => {
                  setRolesMode('custom');
                  setIsRolesModalOpen(true);
                }}
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                  rolesMode === 'custom'
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <span>Select Specific Roles</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${rolesMode === 'custom' ? 'bg-black/20 text-black' : 'bg-white/10 text-white'}`}>
                  {selectedRoles.length}
                </span>
              </button>
            </div>
          </div>

          {/* Channels & Categories Configuration */}
          <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                <Hash className="w-4 h-4 text-white" />
                <span>Channels & Categories Architecture</span>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {sourceDetails?.categories?.reduce((acc, c) => acc + c.channels.length, 0) || 0} Channels
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setChannelsMode('all')}
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  channelsMode === 'all'
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                Clone All Channels & Categories
              </button>
              <button
                type="button"
                onClick={() => {
                  setChannelsMode('custom');
                  setIsChannelsModalOpen(true);
                }}
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                  channelsMode === 'custom'
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <span>Select Channels</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${channelsMode === 'custom' ? 'bg-black/20 text-black' : 'bg-white/10 text-white'}`}>
                  {selectedChannels.length}
                </span>
              </button>
            </div>
          </div>

          {/* Message History Cloning */}
          <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-white" />
                <span>Message History Replication</span>
              </div>
              <input
                type="checkbox"
                checked={messagesEnabled}
                onChange={(e) => setMessagesEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-white focus:ring-0 cursor-pointer accent-white"
              />
            </div>

            {messagesEnabled ? (
              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="text-zinc-300">Message History Limit per Channel</span>
                    <span className="text-white font-mono">{messageLimit} messages</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={messageLimit}
                    onChange={(e) => setMessageLimit(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                    <span>5 (Fast)</span>
                    <span>50 (Recommended)</span>
                    <span>100 (Max)</span>
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={cloneAttachments}
                    onChange={(e) => setCloneAttachments(e.target.checked)}
                    className="w-4 h-4 rounded text-white focus:ring-0 cursor-pointer accent-white"
                  />
                  <span>Clone Media Attachments & Image Links via Relay Webhooks</span>
                </label>
              </div>
            ) : (
              <p className="text-xs text-zinc-400">
                Enable to clone recent message history with original author avatars & usernames.
              </p>
            )}
          </div>

          {/* Action Trigger Button */}
          <button
            type="button"
            disabled={jobStatus === 'running'}
            onClick={() => setConfirmModal(true)}
            className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Discord Server Clone Operation</span>
          </button>
        </div>
      </div>

      {/* Live Real-Time Logs Terminal */}
      <div className="pt-4">
        <CloneLogs
          jobId={activeJobId}
          logs={logs}
          status={jobStatus}
          onStop={handleStopClone}
          onClear={() => setLogs([])}
        />
      </div>

      {/* Confirmation Modal */}
      {confirmModal && createPortal(
        <div className="fixed inset-0 w-screen h-screen bg-black/85 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Confirm Clone Operation</h3>
                <p className="text-xs text-zinc-400">This will modify target server contents</p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Source:</span>
                <span className="font-semibold text-white truncate max-w-[200px]">
                  {sourceGuild?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Target:</span>
                <span className="font-semibold text-white truncate max-w-[200px]">
                  {targetGuild?.name}
                </span>
              </div>
              {clearTarget && (
                <div className="flex justify-between text-white font-semibold pt-1 border-t border-zinc-800">
                  <span>Target Server Wipe:</span>
                  <span className="text-red-400">Active</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(false)}
                className="flex-1 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-colors border border-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartClone}
                className="flex-1 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition-all shadow-xl"
              >
                Confirm & Start
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Roles Selection Modal */}
      {isRolesModalOpen && sourceDetails && createPortal(
        <div className="fixed inset-0 w-screen h-screen bg-black/85 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl text-white">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Select Roles to Clone</h3>
              <button
                onClick={() => setIsRolesModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {sourceDetails.roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: role.color !== '#000000' ? role.color : '#ffffff' }}
                    />
                    <span className="font-semibold text-white">{role.name}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles((prev) => [...prev, role.id]);
                      } else {
                        setSelectedRoles((prev) => prev.filter((id) => id !== role.id));
                      }
                    }}
                    className="w-4 h-4 rounded text-white focus:ring-0 cursor-pointer accent-white"
                  />
                </label>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setIsRolesModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider"
              >
                Done ({selectedRoles.length} selected)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Channels & Categories Selection Modal */}
      {isChannelsModalOpen && sourceDetails && createPortal(
        <div className="fixed inset-0 w-screen h-screen bg-black/85 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl text-white">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Select Channels & Categories</h3>
              <button
                onClick={() => setIsChannelsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {sourceDetails.categories.map((cat) => {
                const catChannelIds = cat.channels.map((c) => c.id);
                const allCatSelected = catChannelIds.length > 0 && catChannelIds.every((id) => selectedChannels.includes(id));
                const someCatSelected = catChannelIds.some((id) => selectedChannels.includes(id));

                const toggleCategory = () => {
                  if (allCatSelected) {
                    setSelectedChannels((prev) => prev.filter((id) => id !== cat.id && !catChannelIds.includes(id)));
                  } else {
                    const toAdd = [cat.id, ...catChannelIds].filter((id) => !selectedChannels.includes(id));
                    setSelectedChannels((prev) => [...prev, ...toAdd]);
                  }
                };

                return (
                  <div key={cat.id} className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-2">
                    {/* Category Header Row with Selection Toggle */}
                    <div 
                      onClick={toggleCategory}
                      className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 cursor-pointer transition select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📁</span>
                        <span className="text-xs font-black text-white uppercase tracking-wider">{cat.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono font-normal">({cat.channels.length} channels)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={allCatSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someCatSelected && !allCatSelected;
                        }}
                        onChange={toggleCategory}
                        className="w-4 h-4 rounded text-white focus:ring-0 cursor-pointer accent-white"
                      />
                    </div>

                    {/* Channels List under this Category */}
                    <div className="space-y-1 pl-2">
                      {cat.channels.map((ch) => (
                        <label
                          key={ch.id}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900/80 cursor-pointer text-xs transition"
                        >
                          <div className="flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-zinc-300">{ch.name}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedChannels.includes(ch.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedChannels((prev) => [...prev, ch.id, cat.id]);
                              } else {
                                setSelectedChannels((prev) => prev.filter((id) => id !== ch.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-white focus:ring-0 cursor-pointer accent-white"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setIsChannelsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider shadow-lg"
              >
                Done ({selectedChannels.length} selected)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
