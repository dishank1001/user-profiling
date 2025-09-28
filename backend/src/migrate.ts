import 'dotenv/config'
import path from 'path'
import fs from 'fs'
import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

import { pool } from './db';

interface MigrationRow extends RowDataPacket { filename: string }

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error('Database URL not found')
}

const getMigrationFiles = (): string[] => {
    const dir = path.resolve(__dirname, '../migrations')

    if(!fs.existsSync(dir)) {
        console.error(`Migrations directory not found: ${dir}`);
        process.exit(1)
    }
    
    return fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
}

const ensureMigrationsTable = async (conn: any) => {
    await conn.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB    
    `)
}

const getAppliedFilenames = async (conn: PoolConnection): Promise<Set<string>> => {
    const [rows] = await conn.query<MigrationRow[]>(
        'SELECT filename FROM schema_migrations ORDER BY id ASC'
    );
    return new Set(rows.map(r => r.filename));
};

const beginTransaction = async (conn: PoolConnection, filepath: string, filename: string) => {
    const sql = fs.readFileSync(filepath, 'utf-8')

    if(!sql) {
        console.log('Skipping empty migration')
        return
    }

    await conn.beginTransaction()

    try {
        await conn.query(sql)
        await conn.query(`INSERT INTO schema_migrations (filename) VALUES (?)`, [filename])
        await conn.commit()
        console.log(`✔ applied ${filename}`);
    } catch (err) {
        await conn.rollback()
        console.error(`✖ failed ${filename}:`, err);
        throw err;
    }
}

const main = async () => {
    const files = getMigrationFiles()
    const conn = await pool.getConnection()

    try {
        await ensureMigrationsTable(conn)
        const applied = await getAppliedFilenames(conn)
        const pending = files.filter(file => !applied.has(file))

        if (!pending.length){
            console.log('No migration to run')
        }

        for(const filename of pending) {
            const filepath = path.resolve(__dirname, '../migrations', filename)
            await beginTransaction(conn, filepath, filename)
        }

        console.log('All migration completed')
    } finally {
        conn.release()
        await pool.end()
    }

    console.log(files)
}

main().catch(async (err) => {
    console.error('Migration run failed:', err);
    try { await pool.end(); } catch {}
    process.exit(1);
})