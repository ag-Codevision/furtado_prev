const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Omeg%40256489%40256489@db.dnakrupxobjwfbhygtuk.supabase.co:5432/postgres';

async function test() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected!');

        // Check where the clients table is
        const result = await client.query(`SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'clients'`);
        console.log('Tables found:', result.rows);

        // Check grants on the table
        const grants = await client.query(`SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'clients' AND table_schema = 'public'`);
        console.log('Grants:', grants.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

test();
