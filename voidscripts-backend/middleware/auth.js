const crypto = require('crypto');

// Compara o token enviado pelo painel com o ADMIN_TOKEN do .env,
// usando comparação de tempo constante para evitar timing attacks.
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const expected = process.env.ADMIN_TOKEN || '';

  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_TOKEN não configurado no servidor.' });
  }

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  const isValid =
    providedBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(providedBuf, expectedBuf);

  if (!isValid) {
    return res.status(401).json({ error: 'Não autorizado. Token inválido ou ausente.' });
  }

  next();
}

module.exports = { requireAdmin };
