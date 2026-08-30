import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  Square,
  Trash2,
  Copy,
  Check,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle
} from 'lucide-react';

export function CloneLogs({ jobId, logs = [], status = 'idle', onStop, onClear }) {
  const [filter, setFilter] = useState('all'); // all | info | success | warn | error
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const logContainerRef = useRef(null);

  // Elapsed timer when running
  useEffect(() => {
    let interval = null;
    if (status === 'running') {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  useEffect(() => {
    if (status === 'idle') {
      setElapsedSeconds(0);
    }
  }, [status]);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    const text = logs.map((l) => `[${l.timeFormatted || l.timestamp}] [${l.type?.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'step') return l.type === 'step';
    return l.type === filter;
  });

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'warn':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
      case 'step':
        return <span className="text-cyan-400 font-bold shrink-0 mt-0.5">▶</span>;
      default:
        return <Info className="w-3.5 h-3.5 text-[#5865F2] shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
      {/* Terminal Titlebar */}
      <div className="bg-[#2b2d31] px-4 py-2.5 flex items-center justify-between border-b border-[#35373c]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-white ml-2">
            <Terminal className="w-4 h-4 text-[#5865F2]" />
            <span>Execution Terminal</span>
            {jobId && <span className="text-discord-textMuted text-[11px]">({jobId})</span>}
          </div>
        </div>

        {/* Status Badge & Controls */}
        <div className="flex items-center gap-2">
          {status === 'running' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#5865F2] animate-ping" />
              <span>RUNNING ({formatTimer(elapsedSeconds)})</span>
            </div>
          )}
          {status === 'completed' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>COMPLETED ({formatTimer(elapsedSeconds)})</span>
            </div>
          )}
          {status === 'failed' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-3 h-3" />
              <span>FAILED</span>
            </div>
          )}
          {status === 'stopped' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-semibold">
              <Square className="w-3 h-3" />
              <span>STOPPED</span>
            </div>
          )}

          {status === 'running' && onStop && (
            <button
              onClick={onStop}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Job</span>
            </button>
          )}
        </div>
      </div>

      {/* Terminal Sub-toolbar (Filters & Actions) */}
      <div className="bg-[#232428] px-4 py-2 flex items-center justify-between border-b border-[#2b2d31] text-xs select-none">
        <div className="flex items-center gap-1">
          {['all', 'info', 'step', 'success', 'warn', 'error'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                filter === f
                  ? 'bg-[#5865F2] text-white'
                  : 'text-discord-textMuted hover:text-white hover:bg-[#2b2d31]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-discord-textMuted cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-[#1e1f22] border-[#35373c] text-[#5865F2] focus:ring-0"
            />
            <span>Auto-scroll</span>
          </label>

          <button
            onClick={handleCopy}
            disabled={logs.length === 0}
            className="flex items-center gap-1 text-discord-textMuted hover:text-white transition-colors"
            title="Copy Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={onClear}
            disabled={logs.length === 0}
            className="flex items-center gap-1 text-discord-textMuted hover:text-rose-400 transition-colors"
            title="Clear Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal Screen Body */}
      <div
        ref={logContainerRef}
        className="flex-1 bg-[#111214] p-4 overflow-y-auto font-mono text-xs space-y-1.5 leading-relaxed"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-discord-textMuted/60 select-none">
            <Terminal className="w-8 h-8 mb-2 opacity-30" />
            <p>No log records to display. Start a clone operation to view live output.</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={index}
              className={`flex items-start gap-2.5 py-0.5 px-1.5 rounded transition-colors hover:bg-[#18191c] ${
                log.type === 'step' ? 'bg-[#5865F2]/10 border-l-2 border-[#5865F2] text-cyan-200 font-semibold' : ''
              } ${log.type === 'error' ? 'text-rose-300' : ''} ${log.type === 'warn' ? 'text-amber-300' : ''} ${
                log.type === 'success' ? 'text-emerald-300' : ''
              } ${log.type === 'info' ? 'text-[#dbdee1]' : ''}`}
            >
              <span className="text-[#80848e] shrink-0 select-none text-[11px]">
                [{log.timeFormatted || log.timestamp?.split('T')[1]?.split('.')[0] || '00:00:00'}]
              </span>
              {renderIcon(log.type)}
              <span className="break-all whitespace-pre-wrap flex-1">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
