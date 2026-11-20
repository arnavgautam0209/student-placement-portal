const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'placement_demo_password',
  database: process.env.DB_NAME || 'placement'
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, branch, cgpa FROM students ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('GET students failed:', error.message);
    res.status(500).json({ error: 'Could not retrieve students' });
  }
});

app.post('/api/students', async (req, res) => {
  const { name, email, branch, cgpa } = req.body;
  const score = Number(cgpa);
  if (!name?.trim() || !email?.trim() || !branch?.trim() || !Number.isFinite(score) || score < 0 || score > 10) {
    return res.status(400).json({ error: 'Enter name, email, branch, and a CGPA between 0 and 10.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO students (name, email, branch, cgpa) VALUES ($1, $2, $3, $4) RETURNING id, name, email, branch, cgpa',
      [name.trim(), email.trim(), branch.trim(), score]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('POST student failed:', error.message);
    res.status(500).json({ error: 'Could not save student' });
  }
});

async function start() {
  // Retry briefly while PostgreSQL finishes starting.
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        branch VARCHAR(60) NOT NULL,
        cgpa NUMERIC(4,2) NOT NULL CHECK (cgpa >= 0 AND cgpa <= 10)
      )`);
      app.listen(5000, '0.0.0.0', () => console.log('Backend listening on port 5000'));
      return;
    } catch (error) {
      console.log(`Waiting for PostgreSQL (${attempt}/20): ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  console.error('Could not connect to PostgreSQL after multiple attempts.');
  process.exit(1);
}

start();
