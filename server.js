const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const DB_HOST = process.env.DB_HOST || 'mysql';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'rootpassword';
const DB_NAME = process.env.DB_NAME || 'employeesdb';
const PORT = process.env.PORT || 8080;

let pool;

async function initDb() {
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10
  });

  // Create DB and table if not exists
  await pool.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await pool.query(`USE \`${DB_NAME}\``);
  await pool.query(`CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL
  )`);
  console.log('DB initialized');
}

app.get('/', (req, res) => {
  res.send('Employees app running. Use GET /employees and POST /employees');
});

app.get('/employees', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM \`${DB_NAME}\`.employees`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/employees', async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'name and role required' });
    const [result] = await pool.query(`INSERT INTO \`${DB_NAME}\`.employees (name, role) VALUES (?, ?)`, [name, role]);
    res.json({ id: result.insertId, name, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, async () => {
  try {
    await initDb();
    console.log(`Server listening on port ${PORT}`);
  } catch (err) {
    console.error('Failed to initialize DB:', err);
    process.exit(1);
  }
});
