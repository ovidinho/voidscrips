const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_CATEGORIES = [
  'Simuladores', 'Shooters', 'RPG & Aventura', 'Horror',
  'Tycoons', 'Anime', 'Fighting', 'Obby & Parkour', 'Outros'
];

function toRow(body) {
  return {
    game: String(body.game || '').trim(),
    category: ALLOWED_CATEGORIES.includes(body.category) ? body.category : 'Outros',
    image: String(body.image || '').trim(),
    source: String(body.source || '').trim(),
    code: String(body.code || ''),
    free: body.free ? 1 : 0,
    updatedFlag: body.updatedFlag ? 1 : 0,
    broken: body.broken ? 1 : 0,
    notes: String(body.notes || '').trim(),
  };
}

function validate(row) {
  if (!row.game) return 'O nome do jogo é obrigatório.';
  if (!row.code) return 'O código do script é obrigatório.';
  if (row.game.length > 120) return 'Nome do jogo muito longo.';
  if (row.code.length > 20000) return 'Código do script muito longo (máx. 20.000 caracteres).';
  return null;
}

function serializePublic(r) {
  return {
    id: r.id,
    game: r.game,
    category: r.category,
    image: r.image,
    source: r.source,
    code: r.code,
    free: !!r.free,
    updatedFlag: !!r.updatedFlag,
    updatedAt: r.updatedAt,
  };
}

function serializeAdmin(r) {
  return {
    ...serializePublic(r),
    broken: !!r.broken,
    notes: r.notes,
    createdAt: r.createdAt,
  };
}

// ---- PÚBLICO: lista de scripts visíveis no site (sem os quebrados, sem notas internas) ----
router.get('/public/scripts', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM scripts WHERE broken = 0 ORDER BY updatedAt DESC'
  ).all();
  res.json(rows.map(serializePublic));
});

// ---- ADMIN: lista completa (inclui quebrados e notas internas) ----
router.get('/scripts', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM scripts ORDER BY updatedAt DESC').all();
  res.json(rows.map(serializeAdmin));
});

// ---- ADMIN: criar script ----
router.post('/scripts', requireAdmin, (req, res) => {
  const row = toRow(req.body);
  const error = validate(row);
  if (error) return res.status(400).json({ error });

  const now = new Date().toISOString();
  const id = 's_' + crypto.randomBytes(6).toString('hex');

  db.prepare(`
    INSERT INTO scripts (id, game, category, image, source, code, free, updatedFlag, broken, notes, createdAt, updatedAt)
    VALUES (@id, @game, @category, @image, @source, @code, @free, @updatedFlag, @broken, @notes, @createdAt, @updatedAt)
  `).run({ id, ...row, createdAt: now, updatedAt: now });

  const created = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id);
  res.status(201).json(serializeAdmin(created));
});

// ---- ADMIN: atualizar script ----
router.put('/scripts/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM scripts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Script não encontrado.' });

  const row = toRow(req.body);
  const error = validate(row);
  if (error) return res.status(400).json({ error });

  const updatedAt = new Date().toISOString();

  db.prepare(`
    UPDATE scripts SET
      game = @game, category = @category, image = @image, source = @source,
      code = @code, free = @free, updatedFlag = @updatedFlag, broken = @broken,
      notes = @notes, updatedAt = @updatedAt
    WHERE id = @id
  `).run({ id: req.params.id, ...row, updatedAt });

  const updated = db.prepare('SELECT * FROM scripts WHERE id = ?').get(req.params.id);
  res.json(serializeAdmin(updated));
});

// ---- ADMIN: remover script ----
router.delete('/scripts/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM scripts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Script não encontrado.' });

  db.prepare('DELETE FROM scripts WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
