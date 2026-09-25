const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 60000;

app.use(require('cors')());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const sessions = new Map();
const staffAccount = { email: process.env.STAFF_EMAIL || 'admin@saveurs-nomades.fr', password: process.env.STAFF_PASSWORD || 'nomades2024', name: 'Équipe Saveurs Nomades' };

// Initialize SQLite DB
const db = new sqlite3.Database(path.join(__dirname, 'db', 'reservations.db'));
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    party INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS stock_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kg',
    threshold REAL NOT NULL DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run("ALTER TABLE reservations ADD COLUMN status TEXT DEFAULT 'pending'", () => {});
  db.get('SELECT COUNT(*) AS count FROM stock_items', (error, row) => {
    if (!error && row.count === 0) {
      const seed = db.prepare('INSERT INTO stock_items (name, category, quantity, unit, threshold) VALUES (?, ?, ?, ?, ?)');
      [['Tomates anciennes', 'Frais', 8, 'kg', 3], ['Pois chiches', 'Épicerie', 12, 'kg', 4], ['Huile d’olive', 'Épicerie', 5, 'L', 2], ['Menthe fraîche', 'Herbes', 0.8, 'kg', 1], ['Citrons', 'Frais', 18, 'pièces', 8]].forEach(item => seed.run(item));
      seed.finalize();
    }
  });
});

function requireStaff(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers.cookie?.match(/sn_session=([^;]+)/)?.[1];
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Authentification requise' });
  req.staff = sessions.get(token);
  next();
}

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers.cookie?.match(/sn_session=([^;]+)/)?.[1];
  res.json({ user: token && sessions.get(token) ? sessions.get(token) : null });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email !== staffAccount.email || password !== staffAccount.password) return res.status(401).json({ error: 'Identifiants incorrects' });
  const token = crypto.randomBytes(24).toString('hex');
  const user = { email: staffAccount.email, name: staffAccount.name };
  sessions.set(token, user);
  res.setHeader('Set-Cookie', `sn_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`);
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers.cookie?.match(/sn_session=([^;]+)/)?.[1];
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', 'sn_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ ok: true });
});

// Simple menus endpoint (could be expanded or loaded from DB)
app.get('/api/menus', (req, res) => {
  const menus = [
    { id: 1, name: 'Menu Découverte', price: '25€', items: ['Entrée', 'Plat', 'Dessert'] },
    { id: 2, name: 'Menu Nomade', price: '35€', items: ['Apéro', 'Entrée', 'Plat', 'Dessert'] }
  ];
  res.json(menus);
});

// Create reservation
app.post('/api/reservations', (req, res) => {
  const { name, email, phone, party, date, time, notes } = req.body;
  if (!name || !email || !party || !date || !time) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  const stmt = db.prepare('INSERT INTO reservations (name,email,phone,party,date,time,notes) VALUES (?,?,?,?,?,?,?)');
  stmt.run(name, email, phone || '', party, date, time, notes || '', function(err) {
    if (err) return res.status(500).json({ error: 'Erreur en base' });

    const reservation = { id: this.lastID, name, email, phone, party, date, time, notes, status: 'pending' };

    // Send confirmation email (configure SMTP via env vars)
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mail = {
        from: process.env.EMAIL_FROM || 'no-reply@saveurs-nomades.local',
        to: email,
        subject: 'Confirmation de réservation - Saveurs Nomades',
        text: `Bonjour ${name},\n\nVotre réservation (pour ${party}) le ${date} à ${time} a bien été prise en compte.\n\nMerci,\nSaveurs Nomades`
      };

      transporter.sendMail(mail).catch(console.error);
    }

    res.json({ reservation });
  });
  stmt.finalize();
});

app.get('/api/dashboard/summary', requireStaff, (req, res) => {
  db.serialize(() => {
    db.get('SELECT COUNT(*) AS total FROM reservations', (error, reservations) => {
      if (error) return res.status(500).json({ error: 'Erreur base de données' });
      db.get("SELECT COUNT(*) AS pending FROM reservations WHERE status IS NULL OR status = 'pending'", (pendingError, pending) => {
        db.get('SELECT COUNT(*) AS lowStock FROM stock_items WHERE quantity <= threshold', (stockError, stock) => {
          if (pendingError || stockError) return res.status(500).json({ error: 'Erreur base de données' });
          res.json({ reservations: reservations.total, pending: pending.pending, lowStock: stock.lowStock });
        });
      });
    });
  });
});

app.get('/api/dashboard/reservations', requireStaff, (req, res) => {
  db.all('SELECT * FROM reservations ORDER BY date ASC, time ASC, created_at DESC', (error, rows) => {
    if (error) return res.status(500).json({ error: 'Erreur base de données' });
    res.json(rows);
  });
});

app.patch('/api/dashboard/reservations/:id', requireStaff, (req, res) => {
  const allowed = ['pending', 'confirmed', 'cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: 'Statut invalide' });
  db.run('UPDATE reservations SET status = ? WHERE id = ?', [req.body.status, req.params.id], function(error) {
    if (error) return res.status(500).json({ error: 'Erreur base de données' });
    res.json({ updated: this.changes > 0 });
  });
});

app.get('/api/stock', requireStaff, (req, res) => {
  db.all('SELECT * FROM stock_items ORDER BY category, name', (error, rows) => {
    if (error) return res.status(500).json({ error: 'Erreur base de données' });
    res.json(rows);
  });
});

app.post('/api/stock', requireStaff, (req, res) => {
  const { name, category, quantity, unit, threshold } = req.body;
  if (!name || !category || quantity === undefined || !unit) return res.status(400).json({ error: 'Champs requis manquants' });
  db.run('INSERT INTO stock_items (name, category, quantity, unit, threshold) VALUES (?, ?, ?, ?, ?)', [name, category, Number(quantity), unit, Number(threshold || 1)], function(error) {
    if (error) return res.status(500).json({ error: 'Erreur base de données' });
    res.json({ id: this.lastID });
  });
});

app.patch('/api/stock/:id', requireStaff, (req, res) => {
  const fields = ['name', 'category', 'quantity', 'unit', 'threshold'];
  const updates = fields.filter(field => req.body[field] !== undefined);
  if (!updates.length) return res.status(400).json({ error: 'Aucune modification' });
  const values = updates.map(field => req.body[field]);
  db.run(`UPDATE stock_items SET ${updates.map(field => `${field} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, req.params.id], function(error) {
    if (error) return res.status(500).json({ error: 'Erreur base de données' });
    res.json({ updated: this.changes > 0 });
  });
});

app.delete('/api/stock/:id', requireStaff, (req, res) => {
  db.run('DELETE FROM stock_items WHERE id = ?', req.params.id, function(error) {
    if (error) return res.status(500).json({ error: 'Erreur base de données' });
    res.json({ deleted: this.changes > 0 });
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
