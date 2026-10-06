require('dotenv').config();
const express = require('express');
const path = require('path');

const analyzeRoutes = require('./routes/analyzeRoutes');
const { router: authRoutes } = require('./routes/authRoutes');
const gtmRoutes = require('./routes/gtmRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Set Cross-Origin headers and log requests
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Avoid 404 for favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api', analyzeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/gtm', gtmRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
