import express from 'express';
import { keyService } from '../services/keyService.js';

export const adminRouter = express.Router();

// Middleware to protect admin routes
function requireAdmin(req, res, next) {
  const user = req.session?.user;
  if (!user || !keyService.isAdmin(user.id)) {
    return res.status(403).json({ error: 'Access denied. Administrator permissions required.' });
  }
  next();
}

// POST /api/admin/keys/generate
adminRouter.post('/keys/generate', requireAdmin, async (req, res) => {
  const { duration, note, prefix, amount = 1 } = req.body;
  const count = Math.min(Math.max(parseInt(amount) || 1, 1), 50);
  const createdKeys = [];

  for (let i = 0; i < count; i++) {
    const key = await keyService.createKey({ duration: duration || '30d', note: note || '', prefix: prefix || 'VEIL' });
    createdKeys.push(key);
  }

  res.json({ success: true, keys: createdKeys });
});

// GET /api/admin/keys
adminRouter.get('/keys', requireAdmin, (req, res) => {
  const keys = keyService.getAllKeys();
  res.json({ keys });
});

// DELETE /api/admin/keys/:key
adminRouter.delete('/keys/:key', requireAdmin, async (req, res) => {
  const success = await keyService.deleteKey(req.params.key);
  res.json({ success });
});

// GET /api/admin/export
adminRouter.get('/export', requireAdmin, (req, res) => {
  const data = keyService.getFullData();
  res.json(data);
});

// POST /api/admin/import
adminRouter.post('/import', requireAdmin, (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'Data payload required' });
  const success = keyService.importFullData(data);
  res.json({ success });
});

// GET /api/admin/bans
adminRouter.get('/bans', requireAdmin, (req, res) => {
  const bans = keyService.getBannedUsers();
  res.json({ bans });
});

// POST /api/admin/bans
adminRouter.post('/bans', requireAdmin, async (req, res) => {
  const { discordId, reason } = req.body;
  if (!discordId) {
    return res.status(400).json({ error: 'discordId is required' });
  }
  await keyService.banUser(discordId, reason || 'Banned by admin', req.session.user.username);
  res.json({ success: true });
});

// DELETE /api/admin/bans/:id
adminRouter.delete('/bans/:id', requireAdmin, async (req, res) => {
  const success = await keyService.unbanUser(req.params.id);
  res.json({ success });
});

// POST /api/admin/admins
adminRouter.post('/admins', requireAdmin, (req, res) => {
  const { discordId } = req.body;
  if (!discordId) return res.status(400).json({ error: 'discordId required' });
  keyService.addAdmin(discordId);
  res.json({ success: true });
});
