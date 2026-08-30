import express from 'express';
import axios from 'axios';
import { config } from '../config.js';
import { keyService } from '../services/keyService.js';

export const authRouter = express.Router();

// GET /api/auth/login
authRouter.get('/login', (req, res) => {
  if (!config.discord.clientId || !config.discord.clientSecret) {
    return res.status(500).json({
      error: 'DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is missing from environment variables on Render.'
    });
  }

  const oauthUrl = `https://discord.com/oauth2/authorize?client_id=${config.discord.clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    config.discord.redirectUri
  )}&scope=identify+guilds`;

  res.redirect(oauthUrl);
});

// GET /api/auth/callback
authRouter.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${config.frontendUrl}?auth_error=no_code`);
  }

  try {
    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: config.discord.clientId,
        client_secret: config.discord.clientSecret,
        grant_type: 'authorization_code',
        code: code.toString(),
        redirect_uri: config.discord.redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, token_type } = tokenResponse.data;

    // Fetch user profile
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });

    // Fetch user guilds
    const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });

    const user = userResponse.data;
    req.session.accessToken = access_token;
    req.session.user = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      global_name: user.global_name || user.username,
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png',
    };
    req.session.userGuilds = guildsResponse.data;

    res.redirect(config.frontendUrl);
  } catch (error) {
    console.error('[AUTH ERROR]', error.response?.data || error.message);
    res.redirect(`${config.frontendUrl}?auth_error=token_exchange_failed`);
  }
});

// GET /api/auth/me
authRouter.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    const userId = req.session.user.id;
    const license = keyService.getUserLicense(userId);
    const isAdmin = keyService.isAdmin(userId);

    return res.json({
      authenticated: true,
      user: req.session.user,
      license,
      isAdmin,
      botInviteUrl: config.discord.botInviteUrl,
    });
  }

  res.status(401).json({ authenticated: false, user: null });
});

// POST /api/auth/redeem
authRouter.post('/redeem', (req, res) => {
  const user = req.session?.user;
  if (!user) {
    return res.status(401).json({ error: 'Please log in with Discord first.' });
  }

  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'License key is required.' });
  }

  const result = keyService.redeemKey(user.id, user.username, key);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ success: true, license: keyService.getUserLicense(user.id) });
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});
