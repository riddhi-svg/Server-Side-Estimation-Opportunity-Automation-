require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const analyzeRoutes = require('./routes/analyzeRoutes');
const { router: authRoutes } = require('./routes/authRoutes');
const gtmRoutes = require('./routes/gtmRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

const distPath = path.join(__dirname, '../../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api', analyzeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/gtm', gtmRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
