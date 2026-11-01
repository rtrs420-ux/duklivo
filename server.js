const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Cloud Database Connection (Neon se link aayega)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Table Setup
pool.query(`
  CREATE TABLE IF NOT EXISTS store (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    data TEXT
  )
`, (err) => {
  if (err) console.error('DB Error:', err.message);
  else console.log('✅ Connected to Cloud PostgreSQL Database');
});

// Get Data
app.get('/api/data', async (req, res) => {
  try {
    const result = await pool.query(`SELECT data FROM store WHERE name = 'main_store'`);
    if (result.rows.length === 0) return res.json({ ok: true, data: null });
    res.json({ ok: true, data: JSON.parse(result.rows[0].data) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Save Data
app.post('/api/data', async (req, res) => {
  try {
    const dataStr = JSON.stringify(req.body);
    await pool.query(`
      INSERT INTO store (name, data) 
      VALUES ('main_store', $1)
      ON CONFLICT (name) 
      DO UPDATE SET data = EXCLUDED.data
    `, [dataStr]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Download Backup
app.get('/api/backup', async (req, res) => {
  try {
    const result = await pool.query(`SELECT data FROM store WHERE name = 'main_store'`);
    if (result.rows.length === 0) return res.status(404).json({ ok: false });
    res.setHeader('Content-Disposition', 'attachment; filename="DukLivo_Backup.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(result.rows[0].data);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  🛒 DukLivo Server Started!`);
  console.log(`  💻 Local:  http://localhost:${PORT}\n`);
});