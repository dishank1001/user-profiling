import express from 'express';
import 'dotenv/config'

import { ping, pool } from './db';

const app = express()

app.use(express.json())

const PORT = process.env.PORT || 3001

app.get('/', (req, res) => {
    res.send("Hello world")
})

app.get('/healthz', async (req, res) => {
    const dbOk = await ping()

    res
    .status(dbOk ? 200 : 500)
    .json({
        status: dbOk ? 'ok' : 'degraded',
        uptime: process.uptime(),
        checks: { db: dbOk ? 'up' : 'down' },
        timestamp: new Date().toISOString(),
    })
})

//TODO:: Add validations
app.post('/v1/profile', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { userId, email } = req.body

    // very basic validation
    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' })
    }

    await conn.query(
      `INSERT INTO profiles (user_id, email) VALUES (?, ?)`,
      [userId, email]
    )

    res.status(201).json({ message: 'Profile created' })
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Duplicate entry' })
    }
    console.error('Error creating profile', { code: error?.code })
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    conn.release()
  }
})


app.get('/v1/profiles', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query('SELECT * FROM profiles')
    res.status(200).json({ data: rows })
  } catch (error) {
    console.error('Error fetching profiles',)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    conn.release()
  }
})

app.listen(PORT, () => {
    console.log("Listening on port " + PORT)
})
