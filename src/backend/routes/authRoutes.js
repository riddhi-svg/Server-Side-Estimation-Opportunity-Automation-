const express = require('express');
const router = express.Router();
const { getValidGtmAccessToken, setManualAccessToken } = require('../services/tokenService');

// Check authentication status
router.get('/status', async (req, res) => {
  try {
    const token = await getValidGtmAccessToken();
    res.json({
      authenticated: Boolean(token),
      hasEnterpriseToken: Boolean(process.env.ENTERPRISE_TOKEN)
    });
  } catch (err) {
    res.json({ authenticated: false, error: err.message });
  }
});

// Endpoint to optionally store token on server
router.post('/token', (req, res) => {
  const { token } = req.body;
  if (token) {
    setManualAccessToken(token);
    return res.json({ success: true });
  }
  res.status(400).json({ error: 'Token missing' });
});

// Fallback redirect to home
router.get('/google', (req, res) => {
  res.redirect('/');
});

module.exports = { router, getGtmToken: getValidGtmAccessToken };
