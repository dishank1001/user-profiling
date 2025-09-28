import express from 'express';
import 'dotenv/config'

import { ping } from './db';

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

app.listen(PORT, () => {
    console.log("Listening on port " + PORT)
})
