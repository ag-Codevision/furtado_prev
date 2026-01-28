const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Omeg%40256489%40256489@db.dnakrupxobjwfbhygtuk.supabase.co:5432/postgres';

async function test() {
    const client = new Client({
        connectionString: connectionString,
        connectionTimeoutMillis: 5000,
    });

    console.log('Connecting to Postgres...');
    try {
        await client.connect();
        console.log('Postgres connection successful!');

        const total = await client.query('SELECT COUNT(*) FROM clients');
        console.log('Total Clients in DB:', total.rows[0].count);

        const statusCounts = await client.query('SELECT status, COUNT(*) FROM clients GROUP BY status');
        console.log('Counts by Status:', statusCounts.rows);

        const activeCounts = await client.query("SELECT data->>'active' as active, COUNT(*) FROM clients GROUP BY data->>'active'");
        console.log('Counts by data->active:', activeCounts.rows);

        const samples = await client.query('SELECT name, status, data->>\'active\' as active FROM clients ORDER BY registration_date DESC LIMIT 5');
        console.log('Recent Clients:', samples.rows);

    } catch (err) {
        console.error('Postgres connection failed:', err.message);
    } finally {
        await client.end();
    }
}

test();
