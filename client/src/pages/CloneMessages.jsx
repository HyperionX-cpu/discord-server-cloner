import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MessageSquareShare,
  Hash,
  ArrowRight,
  Play,
  CheckCircle,
  FileImage,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CloneLogs } from '../components/CloneLogs';
import { CustomSelect } from '../components/CustomSelect';

export function CloneMessages() {
  const { mutualGuilds, sourceGuild, setSourceGuild, targetGuild, setTargetGuild } = useAuth();

  const [sourceDetails, setSourceDetails] = useState(null);
  const [targetDetails, setTargetDetails] = useState(null);

  const [sourceChannelId, setSourceChannelId] = useState('');
  const [targetChannelId, setTargetChannelId] = useState('');
  const [messageLimit, setMessageLimit] = useState(50);
  const [cloneAttachments, setCloneAttachments] = useState(true);

  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState('idle');
  const [logs, setLogs] = useState([]);

  // Fetch source details
  useEffect(() => {
    if (!sourceGuild?.id) return;
    axios.get(`/api/guilds/${sourceGuild.id}/details`).then((res) => {
      setSourceDetails(res.data);
      const firstTextCh = res.data.categories?.flatMap((c) => c.channels).find((c) => c.type === 0);
      if (firstTextCh) setSourceChannelId(firstTextCh.id);
    });
  }, [sourceGuild]);

  // Fetch target details
  useEffect(() => {
    if (!targetGuild?.id) return;
    axios.get(`/api/guilds/${targetGuild.id}/details`).then((res) => {
      setTargetDetails(res.data);
      const firstTextCh = res.data.categories?.flatMap((c) => c.channels).find((c) => c.type === 0);
      if (firstTextCh) setTargetChannelId(firstTextCh.id);
    });
  }, [targetGuild]);

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
      } catch (err) {}
    };

    return () => {
      eventSource.close();
    };
  }, [activeJobId]);

  const handleStartMessageClone = async () => {
    if (!sourceGuild || !targetGuild) return;
    setJobStatus('running');
    setLogs([]);

    try {
      const payload = {
        sourceGuildId: sourceGuild.id,
        targetGuildId: targetGuild.id,
        options: {
          clearTarget: false,
          roles: { mode: 'none' },
          channels: { mode: 'none' },
          messages: {
            enabled: true,
            limitPerChannel: messageLimit,
            cloneAttachments,
            specificSourceChannel: sourceChannelId,
            specificTargetChannel: targetChannelId,
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
          message: `Failed: ${err.response?.data?.error || err.message}`,
        },
      ]);
    }
  };

  const allSourceTextChannels =
    sourceDetails?.categories?.flatMap((c) => c.channels).filter((ch) => ch.type === 0 || ch.type === 5) || [];
  const allTargetTextChannels =
    targetDetails?.categories?.flatMap((c) => c.channels).filter((ch) => ch.type === 0 || ch.type === 5) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Channel Message Cloner</h1>
        <p className="text-sm text-discord-textMuted mt-1">
          Replicate conversation history between specific text channels with webhook impersonation (original avatars and names).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Source Channel Card */}
        <div className="lg:col-span-5 bg-[#121215] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-zinc-800 pb-3 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            <span>Source Channel</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Server</label>
              <CustomSelect
                value={sourceGuild?.id || ''}
                onChange={(val) => {
                  const g = mutualGuilds.find((item) => item.id === val);
                  setSourceGuild(g || null);
                }}
                options={mutualGuilds.map((g) => ({
                  value: g.id,
                  label: g.name,
                }))}
                placeholder="Select Server"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">
                Text Channel
              </label>
              <CustomSelect
                value={sourceChannelId}
                onChange={(val) => setSourceChannelId(val)}
                options={allSourceTextChannels.map((c) => ({
                  value: c.id,
                  label: `#${c.name}`,
                }))}
                placeholder="Select Channel"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="lg:col-span-2 flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-xl">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>

        {/* Target Channel Card */}
        <div className="lg:col-span-5 bg-[#121215] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-zinc-800 pb-3 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            <span>Target Channel</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Server</label>
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
                placeholder="Select Server"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">
                Text Channel
              </label>
              <CustomSelect
                value={targetChannelId}
                onChange={(val) => setTargetChannelId(val)}
                options={allTargetTextChannels.map((c) => ({
                  value: c.id,
                  label: `#${c.name}`,
                }))}
                placeholder="Select Channel"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings & Action Card */}
      <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <div>
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
            <span className="text-white">Message Fetch Limit</span>
            <span className="text-zinc-400 font-mono">{messageLimit} messages</span>
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
        </div>

        <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 cursor-pointer">
          <input
            type="checkbox"
            checked={cloneAttachments}
            onChange={(e) => setCloneAttachments(e.target.checked)}
            className="w-4 h-4 rounded text-white focus:ring-0 cursor-pointer accent-white"
          />
          <div className="flex items-center gap-2">
            <FileImage className="w-4 h-4 text-zinc-400" />
            <span>Forward images, file attachments & rich embeds</span>
          </div>
        </label>

        <button
          type="button"
          disabled={jobStatus === 'running'}
          onClick={handleStartMessageClone}
          className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Execute Message Transfer</span>
        </button>
      </div>

      {/* Terminal */}
      <CloneLogs
        jobId={activeJobId}
        logs={logs}
        status={jobStatus}
        onClear={() => setLogs([])}
      />
    </div>
  );
}
