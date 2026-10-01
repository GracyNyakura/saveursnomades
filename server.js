const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { catalog } = require('./public/js/menu');

const app = express();
const PORT = process.env.PORT || 60000;
app.set('trust proxy', 1);

app.use(require('cors')());
app.use(bodyParser.json());
app.use((req, res, next) => {
  if (req.path.endsWith('/styles.css')) res.setHeader('Cache-Control', 'no-store, max-age=0');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

const sessions = new Map();
const staffAccount = { email: process.env.STAFF_EMAIL || 'admin@saveurs-nomades.fr', password: process.env.STAFF_PASSWORD || 'nomades2024', name: 'Équipe Saveurs Nomades' };
const deliveryFeeUsd = 15;
const kinshasaCommunes = ['Bandalungwa', 'Barumbu', 'Bumbu', 'Gombe', 'Kalamu', 'Kasa-Vubu', 'Kimbanseke', 'Kinshasa', 'Kintambo', 'Kisenso', 'Lemba', 'Limete', 'Lingwala', 'Makala', 'Maluku', 'Masina', 'Matete', 'Mont-Ngafula', 'Ndjili', 'Ngaba', 'Ngaliema', 'Ngiri-Ngiri', 'Nsele', 'Selembao'];

function getPayPalBaseUrl() {
  return process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

function requireCheckoutConfiguration() {
  const missing = ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter(key => !process.env[key]);
  if (missing.length) throw new Error(`Configuration de paiement manquante : ${missing.join(', ')}`);
}

async function supabaseRequest(resource, options = {}) {
  const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${resource}`, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error || 'Erreur de stockage sécurisé');
  return body;
}

async function getPayPalAccessToken() {
  const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error_description || 'Connexion PayPal impossible');
  return body.access_token;
}

async function paypalRequest(pathname, accessToken, options = {}) {
  const response = await fetch(`${getPayPalBaseUrl()}${pathname}`, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Opération PayPal impossible');
  return body;
}

function priceCheckoutOrder(lines) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 30) throw new Error('Choisissez entre 1 et 30 articles.');
  const catalogItems = new Map(catalog.flatMap(category => category.items.map(item => [item[0], { category: category.id, price: Number(item[2].slice(1)) }])));
  const normalized = lines.map(line => {
    const product = catalogItems.get(String(line.name || ''));
    const quantity = Number(line.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error('Un article ou une quantité de la commande est invalide.');
    return { name: String(line.name), category: product.category, quantity, unitPrice: product.price, lineTotal: product.price * quantity };
  });
  if (normalized.reduce((sum, line) => sum + line.quantity, 0) > 100) throw new Error('La commande dépasse la quantité maximale autorisée.');
  return normalized;
}

// Initialize SQLite DB. The data directory may not exist on a fresh deployment.
const dataDirectory = process.env.VERCEL === '1'
  ? path.join('/tmp', 'saveurs-nomades')
  : path.join(__dirname, 'db');
fs.mkdirSync(dataDirectory, { recursive: true });
const db = new sqlite3.Database(path.join(dataDirectory, 'reservations.db'));
db.configure('busyTimeout', 5000);
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
    order_details TEXT,
    status TEXT DEFAULT 'pending',
    fulfillment TEXT NOT NULL DEFAULT 'reservation',
    delivery_commune TEXT,
    delivery_address TEXT,
    delivery_fee REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    payment_id TEXT,
    paypal_order_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS checkout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paypal_order_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    party INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    notes TEXT,
    fulfillment TEXT NOT NULL,
    delivery_commune TEXT,
    delivery_address TEXT,
    delivery_fee REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    order_details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'created',
    reservation_id INTEGER,
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
  db.all('PRAGMA table_info(reservations)', (error, columns) => {
    if (error) return console.error('SQLite schema check failed:', error.message);
    const migrations = [];
    if (!columns.some(column => column.name === 'status')) migrations.push("ALTER TABLE reservations ADD COLUMN status TEXT DEFAULT 'pending'");
    if (!columns.some(column => column.name === 'order_details')) migrations.push('ALTER TABLE reservations ADD COLUMN order_details TEXT');
    if (!columns.some(column => column.name === 'fulfillment')) migrations.push("ALTER TABLE reservations ADD COLUMN fulfillment TEXT NOT NULL DEFAULT 'reservation'");
    if (!columns.some(column => column.name === 'delivery_commune')) migrations.push('ALTER TABLE reservations ADD COLUMN delivery_commune TEXT');
    if (!columns.some(column => column.name === 'delivery_address')) migrations.push('ALTER TABLE reservations ADD COLUMN delivery_address TEXT');
    if (!columns.some(column => column.name === 'delivery_fee')) migrations.push('ALTER TABLE reservations ADD COLUMN delivery_fee REAL NOT NULL DEFAULT 0');
    if (!columns.some(column => column.name === 'total')) migrations.push('ALTER TABLE reservations ADD COLUMN total REAL NOT NULL DEFAULT 0');
    if (!columns.some(column => column.name === 'payment_status')) migrations.push("ALTER TABLE reservations ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'");
    if (!columns.some(column => column.name === 'payment_id')) migrations.push('ALTER TABLE reservations ADD COLUMN payment_id TEXT');
    if (!columns.some(column => column.name === 'paypal_order_id')) migrations.push('ALTER TABLE reservations ADD COLUMN paypal_order_id TEXT');
    migrations.forEach(statement => db.run(statement, migrationError => {
      if (migrationError) console.error('SQLite migration failed:', migrationError.message);
    }));
  });
  db.get('SELECT COUNT(*) AS count FROM stock_items', (error, row) => {
    if (error) return console.error('SQLite stock check failed:', error.message);
    if (row.count === 0) {
      const seed = db.prepare('INSERT INTO stock_items (name, category, quantity, unit, threshold) VALUES (?, ?, ?, ?, ?)');
      [['Tomates anciennes', 'Frais', 8, 'kg', 3], ['Pois chiches', 'Épicerie', 12, 'kg', 4], ['Huile d’olive', 'Épicerie', 5, 'L', 2], ['Menthe fraîche', 'Herbes', 0.8, 'kg', 1], ['Citrons', 'Frais', 18, 'pièces', 8]].forEach(item => seed.run(item));
      seed.finalize(seedError => { if (seedError) console.error('SQLite stock seed failed:', seedError.message); });
    }
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

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
    { id: 1, name: 'Menu Découverte', price: '$28', items: ['Entrée du moment', 'Plat au choix', 'Dessert'] },
    { id: 2, name: 'Menu Nomade', price: '$42', items: ['Apéro', 'Entrée', 'Plat', 'Dessert'] },
    { id: 3, name: 'Menu Grande Traversée', price: '$58', items: ['Deux entrées à partager', 'Plat signature', 'Dessert', 'Cocktail maison'] }
  ];
  res.json(menus);
});

app.get('/api/delivery/options', (req, res) => {
  res.json({ city: 'Kinshasa', currency: 'USD', deliveryFee: deliveryFeeUsd, communes: kinshasaCommunes });
});

app.post('/api/payments/paypal/create-order', async (req, res) => {
  try {
    requireCheckoutConfiguration();
    const { name, email, phone, party, date, time, notes, order, fulfillment, commune, address } = req.body;
    const guestCount = Number(party);
    if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 12) {
      return res.status(400).json({ error: 'Vérifiez le nom, l’email et le nombre de convives.' });
    }
    if (!['reservation', 'delivery'].includes(fulfillment)) return res.status(400).json({ error: 'Mode de commande invalide.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}:\d{2}$/.test(time || '')) return res.status(400).json({ error: 'Choisissez une date et une heure valides.' });
    if (fulfillment === 'delivery' && (!phone?.trim() || !kinshasaCommunes.includes(commune) || !address?.trim())) {
      return res.status(400).json({ error: 'Le téléphone, la commune et l’adresse complète sont obligatoires pour une livraison.' });
    }

    const pricedOrder = priceCheckoutOrder(order);
    const subtotal = pricedOrder.reduce((sum, line) => sum + line.lineTotal, 0);
    const deliveryFee = fulfillment === 'delivery' ? deliveryFeeUsd : 0;
    const total = Number((subtotal + deliveryFee).toFixed(2));
    const reference = `SN-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const origin = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const returnPath = fulfillment === 'delivery' ? '/livraison.html' : '/reservation.html';
    const accessToken = await getPayPalAccessToken();
    const paypalOrder = await paypalRequest('/v2/checkout/orders', accessToken, {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          custom_id: reference,
          description: fulfillment === 'delivery' ? 'Commande à livrer à Kinshasa' : 'Réservation et commande Saveurs Nomades',
          amount: {
            currency_code: 'USD',
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: 'USD', value: subtotal.toFixed(2) },
              ...(deliveryFee ? { shipping: { currency_code: 'USD', value: deliveryFee.toFixed(2) } } : {})
            }
          },
          items: pricedOrder.map(line => ({ name: line.name.slice(0, 127), quantity: String(line.quantity), unit_amount: { currency_code: 'USD', value: line.unitPrice.toFixed(2) }, category: 'PHYSICAL_GOODS' }))
        }],
        application_context: {
          brand_name: 'Saveurs Nomades',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: `${origin}${returnPath}?payment=return`,
          cancel_url: `${origin}${returnPath}?payment=cancelled`
        }
      })
    });
    const approvalUrl = paypalOrder.links?.find(link => link.rel === 'approve')?.href;
    if (!approvalUrl) throw new Error('PayPal n’a pas retourné le lien de paiement.');

    await supabaseRequest('online_orders', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify([{
        paypal_order_id: paypalOrder.id,
        order_reference: reference,
        customer_name: name.trim(),
        customer_email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        party: guestCount,
        requested_date: date,
        requested_time: time,
        notes: String(notes || '').trim().slice(0, 1000) || null,
        fulfillment,
        delivery_commune: fulfillment === 'delivery' ? commune : null,
        delivery_address: fulfillment === 'delivery' ? address.trim().slice(0, 500) : null,
        items: pricedOrder,
        subtotal_usd: subtotal.toFixed(2),
        delivery_fee_usd: deliveryFee.toFixed(2),
        total_usd: total.toFixed(2),
        payment_status: 'pending'
      }])
    });
    res.json({ paypalOrderId: paypalOrder.id, approvalUrl, subtotal, deliveryFee, total, currency: 'USD' });
  } catch (error) {
    console.error('PayPal order creation failed:', error.message);
    const missingConfiguration = error.message.startsWith('Configuration de paiement manquante');
    res.status(missingConfiguration ? 503 : 400).json({ error: missingConfiguration ? 'Le paiement en ligne n’est pas encore configuré.' : error.message });
  }
});

// Create reservation
app.post('/api/payments/paypal/capture-order', async (req, res) => {
  try {
    requireCheckoutConfiguration();
    const paypalOrderId = String(req.body.paypalOrderId || '');
    if (!/^[A-Z0-9-]{8,40}$/i.test(paypalOrderId)) return res.status(400).json({ error: 'Référence PayPal invalide.' });
    const resource = `online_orders?paypal_order_id=eq.${encodeURIComponent(paypalOrderId)}&select=*`;
    const storedOrder = (await supabaseRequest(resource))[0];
    if (!storedOrder) return res.status(404).json({ error: 'Commande de paiement introuvable.' });
    if (storedOrder.payment_status === 'paid') return res.json({ order: storedOrder });

    const accessToken = await getPayPalAccessToken();
    let paypalOrder;
    try {
      paypalOrder = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, accessToken, { method: 'POST', body: '{}' });
    } catch (captureError) {
      paypalOrder = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, accessToken);
      if (paypalOrder.status !== 'COMPLETED') throw captureError;
    }
    const purchaseUnit = paypalOrder.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];
    if (paypalOrder.status !== 'COMPLETED' || purchaseUnit?.custom_id !== storedOrder.order_reference || capture?.amount?.currency_code !== 'USD' || Number(capture?.amount?.value) !== Number(storedOrder.total_usd)) {
      return res.status(409).json({ error: 'Le paiement n’a pas pu être confirmé.' });
    }

    const updated = await supabaseRequest(`${resource}&payment_status=eq.pending`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ payment_status: 'paid', paypal_capture_id: capture.id, paid_at: new Date().toISOString() })
    });
    const completedOrder = updated[0] || (await supabaseRequest(resource))[0];
    if (!completedOrder || completedOrder.payment_status !== 'paid') throw new Error('Le paiement est confirmé, mais la commande n’a pas été enregistrée. Contactez le restaurant avec votre référence PayPal.');

    if (process.env.SMTP_HOST && process.env.ORDERS_EMAIL) {
      const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: process.env.SMTP_PORT || 587, secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      const fulfillmentDetails = completedOrder.fulfillment === 'delivery'
        ? `Livraison : ${completedOrder.delivery_commune}, ${completedOrder.delivery_address}`
        : `Réservation : ${completedOrder.requested_date} à ${completedOrder.requested_time} · ${completedOrder.party} convive(s)`;
      const orderDetails = `${completedOrder.order_reference}\n${completedOrder.customer_name} · ${completedOrder.customer_email} · ${completedOrder.phone || 'sans téléphone'}\n${fulfillmentDetails}\nArticles : ${completedOrder.items.map(item => `${item.quantity} x ${item.name}`).join(', ')}\nTotal payé : $${completedOrder.total_usd} USD`;
      transporter.sendMail({ from: process.env.EMAIL_FROM || 'no-reply@saveurs-nomades.local', to: process.env.ORDERS_EMAIL, subject: `Commande payée ${completedOrder.order_reference}`, text: orderDetails }).catch(console.error);
      transporter.sendMail({ from: process.env.EMAIL_FROM || 'no-reply@saveurs-nomades.local', to: completedOrder.customer_email, subject: `Confirmation ${completedOrder.order_reference} — Saveurs Nomades`, text: `Votre paiement de $${completedOrder.total_usd} USD est confirmé.\n\n${orderDetails}` }).catch(console.error);
    }
    res.json({ order: completedOrder });
  } catch (error) {
    console.error('PayPal capture failed:', error.message);
    const missingConfiguration = error.message.startsWith('Configuration de paiement manquante');
    res.status(missingConfiguration ? 503 : 400).json({ error: missingConfiguration ? 'Le paiement en ligne n’est pas encore configuré.' : error.message });
  }
});

app.post('/api/reservations', (req, res) => {
  res.status(410).json({ error: 'Le paiement est désormais requis. Utilisez le parcours de paiement sécurisé.' });
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

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
