import { EventEmitter } from 'events';

class JobLogger extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map(); // jobId -> { logs: [], status: 'running'|'completed'|'failed'|'stopped', startTime, endTime }
  }

  initJob(jobId) {
    this.jobs.set(jobId, {
      logs: [],
      status: 'running',
      startTime: Date.now(),
      endTime: null,
    });
    this.log(jobId, 'info', `Job initialized: ${jobId}`);
  }

  log(jobId, type, message) {
    const job = this.jobs.get(jobId);
    const entry = {
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString(),
      type: type || 'info', // 'info' | 'success' | 'warn' | 'error' | 'step'
      message,
    };

    if (job) {
      job.logs.push(entry);
    }

    console.log(`[JOB ${jobId}] [${entry.type.toUpperCase()}] ${message}`);
    this.emit(`log:${jobId}`, entry);
    this.emit('log', { jobId, ...entry });
  }

  setJobStatus(jobId, status) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      if (status === 'completed' || status === 'failed' || status === 'stopped') {
        job.endTime = Date.now();
      }
      this.emit(`status:${jobId}`, { status, endTime: job.endTime });
    }
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  getLogs(jobId) {
    const job = this.jobs.get(jobId);
    return job ? job.logs : [];
  }

  clearJob(jobId) {
    this.jobs.delete(jobId);
  }
}

export const logger = new JobLogger();
