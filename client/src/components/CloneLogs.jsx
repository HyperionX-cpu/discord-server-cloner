import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Square,
  Trash2,
  Copy,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle
} from 'lucide-react';

export function CloneLogs({ jobId, logs = [], status = 'idle', onStop, onClear }) {
  const [filter, setFilter] = useState('all'); // all | info | step | success | warn | error
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
        return <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />;
      case 'warn':
        return <AlertTriangle className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />;
      case 'step':
        return <span className="text-white font-bold shrink-0 mt-0.5">▶</span>;
      default:
        return <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="bg-[#121215] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[480px]">
      {/* Terminal Titlebar */}
      <div className="bg-zinc-900/90 px-6 py-3.5 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-white ml-2">
            <Terminal className="w-4 h-4 text-white" />
            <span>Execution Terminal</span>
            {jobId && <span className="text-zinc-500 text-[10px]">({jobId})</span>}
          </div>
        </div>

        {/* Status Badge & Controls */}
        <div className="flex items-center gap-2">
          {status === 'running' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>RUNNING ({formatTimer(elapsedSeconds)})</span>
            </div>
          )}
          {status === 'completed' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-black text-[11px] font-black uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>COMPLETED ({formatTimer(elapsedSeconds)})</span>
            </div>
          )}
          {status === 'failed' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>FAILED</span>
            </div>
          )}
          {status === 'stopped' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-bold">
              <Square className="w-3 h-3" />
              <span>STOPPED</span>
            </div>
          )}

          {status === 'running' && onStop && (
            <button
              onClick={onStop}
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Job</span>
            </button>
          )}
        </div>
      </div>

      {/* Terminal Sub-toolbar (Filters & Actions) */}
      <div className="bg-zinc-900/50 px-6 py-2 flex items-center justify-between border-b border-zinc-800/80 text-xs select-none">
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-zinc-800">
          {['all', 'info', 'step', 'success', 'warn', 'error'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-[11px] capitalize font-bold transition-all ${
                filter === f
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-zinc-400 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-white focus:ring-0 cursor-pointer accent-white"
            />
            <span>Auto-scroll</span>
          </label>

          <button
            onClick={handleCopy}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold transition"
            title="Copy Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={onClear}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-red-400 text-xs font-semibold transition"
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
        className="flex-1 bg-[#09090b] p-6 overflow-y-auto font-mono text-xs space-y-1.5 leading-relaxed"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 select-none">
            <Terminal className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">No log records to display. Start a clone operation to view live output.</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={index}
              className={`flex items-start gap-2.5 py-1 px-2 rounded-xl transition-colors ${
                log.type === 'step' ? 'bg-white/5 border-l-2 border-white text-white font-semibold' : ''
              } ${log.type === 'error' ? 'text-red-400 bg-red-500/5' : ''} ${log.type === 'warn' ? 'text-zinc-300' : ''} ${
                log.type === 'success' ? 'text-white font-bold' : ''
              } ${log.type === 'info' ? 'text-zinc-300' : ''}`}
            >
              <span className="text-zinc-600 shrink-0 select-none text-[11px]">
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
