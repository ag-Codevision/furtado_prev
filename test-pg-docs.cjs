const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Omeg%40256489%40256489@db.dnakrupxobjwfbhygtuk.supabase.co:5432/postgres';

async function test() {
    const client = new Client({
        connectionString: connectionString,
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        const res = await client.query("SELECT name, data->'docsChecklist' as checklist FROM clients");
        res.rows.forEach(r => {
            if (r.checklist) {
                const pendencies = r.checklist.filter(d => d.status === 'Faltando' || d.status === 'Pendente');
                console.log(`Client: ${r.name}, Pendencies: ${pendencies.length}`);
            } else {
                console.log(`Client: ${r.name}, No checklist found.`);
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

test();
