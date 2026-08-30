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
        <div className="lg:col-span-5 bg-[#2b2d31] border border-[#35373c] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#35373c] pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span>Source Channel</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-discord-textMuted block mb-1">Server</label>
              <select
                value={sourceGuild?.id || ''}
                onChange={(e) => {
                  const g = mutualGuilds.find((item) => item.id === e.target.value);
                  setSourceGuild(g || null);
                }}
                className="w-full bg-[#1e1f22] border border-[#35373c] rounded-xl px-3 py-2.5 text-white text-xs font-medium"
              >
                {mutualGuilds.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-discord-textMuted block mb-1">
                Text Channel
              </label>
              <select
                value={sourceChannelId}
                onChange={(e) => setSourceChannelId(e.target.value)}
                className="w-full bg-[#1e1f22] border border-[#35373c] rounded-xl px-3 py-2.5 text-white text-xs font-medium"
              >
                {allSourceTextChannels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="lg:col-span-2 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#2b2d31] border border-[#35373c] flex items-center justify-center text-[#5865F2]">
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>

        {/* Target Channel Card */}
        <div className="lg:col-span-5 bg-[#2b2d31] border border-[#35373c] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#35373c] pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Target Channel</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-discord-textMuted block mb-1">Server</label>
              <select
                value={targetGuild?.id || ''}
                onChange={(e) => {
                  const g = mutualGuilds.find((item) => item.id === e.target.value);
                  setTargetGuild(g || null);
                }}
                className="w-full bg-[#1e1f22] border border-[#35373c] rounded-xl px-3 py-2.5 text-white text-xs font-medium"
              >
                {mutualGuilds.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-discord-textMuted block mb-1">
                Text Channel
              </label>
              <select
                value={targetChannelId}
                onChange={(e) => setTargetChannelId(e.target.value)}
                className="w-full bg-[#1e1f22] border border-[#35373c] rounded-xl px-3 py-2.5 text-white text-xs font-medium"
              >
                {allTargetTextChannels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Settings & Action Card */}
      <div className="bg-[#2b2d31] border border-[#35373c] rounded-2xl p-6 space-y-6">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span className="text-white">Message Fetch Limit</span>
            <span className="text-[#5865F2] font-mono">{messageLimit} messages</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={messageLimit}
            onChange={(e) => setMessageLimit(Number(e.target.value))}
            className="w-full h-2 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
          />
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-[#1e1f22] text-xs text-[#dbdee1] cursor-pointer">
          <input
            type="checkbox"
            checked={cloneAttachments}
            onChange={(e) => setCloneAttachments(e.target.checked)}
            className="rounded text-[#5865F2] focus:ring-0 cursor-pointer"
          />
          <div className="flex items-center gap-2">
            <FileImage className="w-4 h-4 text-discord-textMuted" />
            <span>Forward images, file attachments & rich embeds</span>
          </div>
        </label>

        <button
          type="button"
          disabled={jobStatus === 'running'}
          onClick={handleStartMessageClone}
          className="w-full py-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm shadow-xl shadow-[#5865F2]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
