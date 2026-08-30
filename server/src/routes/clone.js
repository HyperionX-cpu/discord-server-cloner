import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { cloneGuild, stopJob } from '../bot/cloner.js';
import { logger } from '../utils/logger.js';
import { isBotReady } from '../bot/client.js';

export const cloneRouter = express.Router();

// POST /api/clone/start
cloneRouter.post('/start', async (req, res) => {
  const { sourceGuildId, targetGuildId, options } = req.body;

  if (!sourceGuildId || !targetGuildId) {
    return res.status(400).json({ error: 'sourceGuildId and targetGuildId are required.' });
  }

  if (sourceGuildId === targetGuildId) {
    return res.status(400).json({ error: 'Source and Target servers cannot be the same.' });
  }

  const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  logger.initJob(jobId);

  // If running in demo mode without bot token, simulate clone progress for testing
  if (!isBotReady()) {
    logger.log(jobId, 'warn', 'Bot is not connected or in Demo Mode. Running simulation clone...');
    simulateClone(jobId, sourceGuildId, targetGuildId, options);
    return res.json({ jobId, message: 'Simulation clone started' });
  }

  // Run in background
  cloneGuild({
    jobId,
    sourceGuildId,
    targetGuildId,
    options: options || {},
  }).catch((err) => {
    logger.log(jobId, 'error', `Unhandled clone execution error: ${err.message}`);
    logger.setJobStatus(jobId, 'failed');
  });

  res.json({ jobId, message: 'Clone job initiated.' });
});

// GET /api/clone/logs/:jobId (SSE Stream)
cloneRouter.get('/logs/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = logger.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial logs
  res.write(`data: ${JSON.stringify({ type: 'init', logs: job.logs, status: job.status })}\n\n`);

  // Listener for new logs
  const onLog = (logEntry) => {
    res.write(`data: ${JSON.stringify({ type: 'log', log: logEntry })}\n\n`);
  };

  // Listener for status changes
  const onStatus = (statusData) => {
    res.write(`data: ${JSON.stringify({ type: 'status', ...statusData })}\n\n`);
  };

  logger.on(`log:${jobId}`, onLog);
  logger.on(`status:${jobId}`, onStatus);

  req.on('close', () => {
    logger.off(`log:${jobId}`, onLog);
    logger.off(`status:${jobId}`, onStatus);
  });
});

// GET /api/clone/status/:jobId
cloneRouter.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = logger.getJob(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ status: job.status, logsCount: job.logs.length });
});

// POST /api/clone/stop/:jobId
cloneRouter.post('/stop/:jobId', (req, res) => {
  const { jobId } = req.params;
  const stopped = stopJob(jobId);
  if (stopped) {
    logger.log(jobId, 'warn', 'Stop requested by user.');
    logger.setJobStatus(jobId, 'stopped');
    return res.json({ success: true, message: 'Stop signal dispatched.' });
  }
  res.status(400).json({ error: 'Job is not running or not found.' });
});

// Simulation helper for offline/demo tests
async function simulateClone(jobId, sourceId, targetId, options) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const log = (type, msg) => logger.log(jobId, type, msg);

  await sleep(600);
  log('step', `[1/7] Connecting to Discord Gateway and validating permissions...`);
  await sleep(800);

  if (options?.clearTarget) {
    log('step', `[2/7] Purging existing target server configuration...`);
    await sleep(700);
    log('info', `Deleting old channels and categories...`);
    await sleep(600);
    log('info', `Removing non-essential roles...`);
    await sleep(500);
    log('success', `Target server cleaned.`);
  }

  log('step', `[3/7] Cloning server icon, banner, and verification requirements...`);
  await sleep(800);
  log('success', `Server metadata updated.`);

  log('step', `[4/7] Synchronizing Role Hierarchy & Permissions...`);
  const sampleRoles = ['👑 Owner', '🛡️ Admin', '⚔️ Moderator', '⭐ VIP', '🎮 Member'];
  for (const role of sampleRoles) {
    await sleep(450);
    log('info', `Created role: ${role}`);
  }
  log('success', `All roles cloned with permissions intact.`);

  log('step', `[5/7] Cloning Categories and Channel structures...`);
  const sampleChannels = ['rules-and-info', 'announcements', 'general-chat', 'media-and-clips', 'Voice Lounge 1'];
  for (const ch of sampleChannels) {
    await sleep(500);
    log('info', `Created channel: #${ch}`);
  }
  log('success', `Channel architecture synchronized.`);

  if (options?.cloneEmojis) {
    log('step', `[6/7] Cloning Custom Emojis & Animated stickers...`);
    await sleep(700);
    log('success', `Cloned 18 custom emojis.`);
  }

  if (options?.messages?.enabled) {
    log('step', `[7/7] Transferring message history via dynamic relay webhooks...`);
    await sleep(900);
    log('info', `Relaying 25 messages in #general-chat...`);
    await sleep(800);
    log('success', `Message migration complete.`);
  }

  log('success', `🎉 Discord Server Cloning Completed Successfully!`);
  logger.setJobStatus(jobId, 'completed');
}
