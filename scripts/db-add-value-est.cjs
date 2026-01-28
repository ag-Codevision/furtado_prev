
const pg = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Adding value_est to crm_leads...');
        await client.query(`
            ALTER TABLE public.crm_leads 
            ADD COLUMN IF NOT EXISTS value_est TEXT;
        `);
        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
