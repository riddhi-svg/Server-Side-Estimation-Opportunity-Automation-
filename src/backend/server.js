require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');

const analyzeRoutes = require('./routes/analyzeRoutes');
const { router: authRoutes } = require('./routes/authRoutes');
const gtmRoutes = require('./routes/gtmRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoints
const handleHealth = (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
};
app.get('/healthz', handleHealth);
app.get('/api/health', handleHealth);

app.get('/favicon.ico', (req, res) => res.status(204).end());

// API Routes
app.use('/api', analyzeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/gtm', gtmRoutes);

// Static frontend serving in production
const distPath = path.resolve(__dirname, '../../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (['GET', 'HEAD'].includes(req.method) && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing HTTP server');
  server.close(() => console.log('HTTP server closed'));
});

process.on('SIGINT', () => {
  console.log('SIGINT received: closing HTTP server');
  server.close(() => console.log('HTTP server closed'));
});

module.exports = { app, server };

