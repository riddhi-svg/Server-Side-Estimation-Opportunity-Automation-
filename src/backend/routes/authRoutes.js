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

// Provide Firebase Web App configuration from environment
router.get('/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || ''
  });
});

// Fallback redirect to home
router.get('/google', (req, res) => {
  res.redirect('/');
});

module.exports = { router, getGtmToken: getValidGtmAccessToken };
