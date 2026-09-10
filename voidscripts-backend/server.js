require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const scriptsRouter = require('./routes/scripts');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
app.use(cors({
  origin: allowedOrigins.includes('*') ? true : allowedOrigins,
}));

app.use(express.json({ limit: '1mb' }));

// Limite simples de requisições para as rotas de escrita (evita abuso do painel exposto)
const writeAttempts = new Map();
function simpleRateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 30;
  const entry = writeAttempts.get(key) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  writeAttempts.set(key, entry);
  if (entry.count > max) {
    return res.status(429).json({ error: 'Muitas requisições. Tente novamente em instantes.' });
  }
  next();
}
app.use('/api', simpleRateLimit);

app.use('/api', scriptsRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`VoidScripts backend rodando em http://localhost:${PORT}`);
  if (!process.env.ADMIN_TOKEN) {
    console.warn('AVISO: ADMIN_TOKEN não está definido no .env — as rotas de admin vão recusar tudo.');
  }
});
