-- Init DB for reservations
CREATE TABLE IF NOT EXISTS reservations (
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
);

CREATE TABLE IF NOT EXISTS stock_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  threshold REAL NOT NULL DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO stock_items (name, category, quantity, unit, threshold) VALUES
  ('Tomates anciennes', 'Frais', 8, 'kg', 3),
  ('Pois chiches', 'Épicerie', 12, 'kg', 4),
  ('Huile d’olive', 'Épicerie', 5, 'L', 2),
  ('Menthe fraîche', 'Herbes', 0.8, 'kg', 1),
  ('Citrons', 'Frais', 18, 'pièces', 8);
