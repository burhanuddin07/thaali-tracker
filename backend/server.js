const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// On Railway, use /data for persistent storage if available, else __dirname
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname;
const DB_PATH = path.join(DATA_DIR, 'thaali.db');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

app.use(cors());
app.use(express.json());

// Serve built React frontend - check both possible locations
const possibleBuilds = [
  path.join(__dirname, 'frontend', 'build'),
  path.join(__dirname, '..', 'frontend', 'build'),
];
const frontendBuild = possibleBuilds.find(p => fs.existsSync(p));
if (frontendBuild) {
  console.log('Serving frontend from:', frontendBuild);
  app.use(express.static(frontendBuild));
}

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let db;
function saveDb() {
  try { fs.writeFileSync(DB_PATH, Buffer.from(db.export())); }
  catch (e) { console.error('DB save error:', e.message); }
}

async function initDb() {
  const SQL = await initSqlJs();
  db = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();
  db.run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sabeel_no TEXT, full_name TEXT NOT NULL, size TEXT, centre TEXT, contact_no TEXT,
    thaali1_done INTEGER DEFAULT 0, thaali1_date TEXT,
    thaali2_done INTEGER DEFAULT 0, thaali2_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );`);
  saveDb();
  console.log('✅ Database ready at:', DB_PATH);
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}
function queryOne(sql, params = []) { return queryAll(sql, params)[0] || null; }
function run(sql, params = []) { db.run(sql, params); saveDb(); }

const upload = multer({ dest: UPLOAD_DIR });

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: DB_PATH }));

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    fs.unlinkSync(req.file.path);
    const normalize = (key) => key.trim().toLowerCase().replace(/[\s_]+/g, '_');
    db.run('DELETE FROM records;');
    for (const row of rows) {
      const k = Object.keys(row).reduce((acc, key) => { acc[normalize(key)] = row[key]; return acc; }, {});
      const name = String(k['full_name'] || k['name'] || '').trim();
      if (!name) continue;
      db.run('INSERT INTO records (sabeel_no, full_name, size, centre, contact_no) VALUES (?,?,?,?,?)', [
        String(k['sabeel_no'] || k['sabeel'] || '').trim(),
        name,
        String(k['size'] || '').trim(),
        String(k['centres'] || k['centre'] || k['center'] || '').trim(),
        String(k['contact_no'] || k['contact'] || '').trim()
      ]);
    }
    saveDb();
    res.json({ success: true, imported: queryOne('SELECT COUNT(*) as c FROM records').c });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/records', (req, res) => {
  const { centre, size, search } = req.query;
  let sql = 'SELECT * FROM records WHERE 1=1';
  const params = [];
  if (centre && centre !== 'all') { sql += ' AND centre = ?'; params.push(centre); }
  if (size && size !== 'all') { sql += ' AND LOWER(size) = LOWER(?)'; params.push(size); }
  if (search) {
    sql += ' AND (full_name LIKE ? OR sabeel_no LIKE ? OR contact_no LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY centre, full_name';
  res.json(queryAll(sql, params));
});

app.patch('/api/records/bulk/thaali', (req, res) => {
  const { thaali, done, centre, size } = req.body;
  if (![1, 2].includes(Number(thaali))) return res.status(400).json({ error: 'Invalid thaali' });
  const field = `thaali${thaali}_done`, dateField = `thaali${thaali}_date`;
  let sql = `UPDATE records SET ${field} = ?, ${dateField} = ? WHERE 1=1`;
  const params = [done ? 1 : 0, done ? new Date().toISOString() : null];
  if (centre && centre !== 'all') { sql += ' AND centre = ?'; params.push(centre); }
  if (size && size !== 'all') { sql += ' AND LOWER(size) = LOWER(?)'; params.push(size); }
  run(sql, params);
  res.json({ success: true });
});

app.patch('/api/records/:id/thaali', (req, res) => {
  const { id } = req.params;
  const { thaali, done } = req.body;
  if (![1, 2].includes(Number(thaali))) return res.status(400).json({ error: 'Invalid thaali' });
  const field = `thaali${thaali}_done`, dateField = `thaali${thaali}_date`;
  run(`UPDATE records SET ${field} = ?, ${dateField} = ? WHERE id = ?`,
    [done ? 1 : 0, done ? new Date().toISOString() : null, Number(id)]);
  res.json(queryOne('SELECT * FROM records WHERE id = ?', [Number(id)]));
});

app.get('/api/stats', (req, res) => {
  const total = queryOne('SELECT COUNT(*) as c FROM records').c;
  const t1Done = queryOne('SELECT COUNT(*) as c FROM records WHERE thaali1_done=1').c;
  const t2Done = queryOne('SELECT COUNT(*) as c FROM records WHERE thaali2_done=1').c;
  const bothDone = queryOne('SELECT COUNT(*) as c FROM records WHERE thaali1_done=1 AND thaali2_done=1').c;
  const centres = queryAll(`SELECT centre, COUNT(*) as total,
    SUM(CASE WHEN LOWER(size)='big' THEN 1 ELSE 0 END) as big_total,
    SUM(CASE WHEN LOWER(size)='small' THEN 1 ELSE 0 END) as small_total,
    SUM(thaali1_done) as t1_done,
    SUM(CASE WHEN thaali1_done=0 THEN 1 ELSE 0 END) as t1_pending,
    SUM(CASE WHEN thaali1_done=1 AND LOWER(size)='big' THEN 1 ELSE 0 END) as t1_big_done,
    SUM(CASE WHEN thaali1_done=0 AND LOWER(size)='big' THEN 1 ELSE 0 END) as t1_big_pending,
    SUM(CASE WHEN thaali1_done=1 AND LOWER(size)='small' THEN 1 ELSE 0 END) as t1_small_done,
    SUM(CASE WHEN thaali1_done=0 AND LOWER(size)='small' THEN 1 ELSE 0 END) as t1_small_pending,
    SUM(thaali2_done) as t2_done,
    SUM(CASE WHEN thaali2_done=0 THEN 1 ELSE 0 END) as t2_pending,
    SUM(CASE WHEN thaali2_done=1 AND LOWER(size)='big' THEN 1 ELSE 0 END) as t2_big_done,
    SUM(CASE WHEN thaali2_done=0 AND LOWER(size)='big' THEN 1 ELSE 0 END) as t2_big_pending,
    SUM(CASE WHEN thaali2_done=1 AND LOWER(size)='small' THEN 1 ELSE 0 END) as t2_small_done,
    SUM(CASE WHEN thaali2_done=0 AND LOWER(size)='small' THEN 1 ELSE 0 END) as t2_small_pending
    FROM records GROUP BY centre ORDER BY centre`);
  const sizeStats = queryAll(`SELECT LOWER(size) as size, COUNT(*) as total,
    SUM(thaali1_done) as t1_done, SUM(CASE WHEN thaali1_done=0 THEN 1 ELSE 0 END) as t1_pending,
    SUM(thaali2_done) as t2_done, SUM(CASE WHEN thaali2_done=0 THEN 1 ELSE 0 END) as t2_pending
    FROM records WHERE size != '' GROUP BY LOWER(size) ORDER BY size`);
  const t1DateWise = queryAll(`SELECT DATE(thaali1_date) as date, COUNT(*) as count FROM records WHERE thaali1_date IS NOT NULL GROUP BY DATE(thaali1_date) ORDER BY date DESC LIMIT 14`);
  const t2DateWise = queryAll(`SELECT DATE(thaali2_date) as date, COUNT(*) as count FROM records WHERE thaali2_date IS NOT NULL GROUP BY DATE(thaali2_date) ORDER BY date DESC LIMIT 14`);
  res.json({ total, thaali1: { done: t1Done, pending: total - t1Done }, thaali2: { done: t2Done, pending: total - t2Done }, bothDone, centres, sizeStats, t1DateWise, t2DateWise });
});

app.get('/api/centres', (req, res) => {
  res.json(queryAll("SELECT DISTINCT centre FROM records WHERE centre != '' ORDER BY centre").map(r => r.centre));
});

app.get('/api/sizes', (req, res) => {
  res.json(queryAll("SELECT DISTINCT LOWER(size) as size FROM records WHERE size != '' ORDER BY size").map(r => r.size));
});

if (frontendBuild) {
  app.get('*', (req, res) => res.sendFile(path.join(frontendBuild, 'index.html')));
}

initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`✅ Thaali Tracker running on port ${PORT}`));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
