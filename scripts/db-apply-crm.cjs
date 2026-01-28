const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:Omeg%40256489%40256489@db.dnakrupxobjwfbhygtuk.supabase.co:5432/postgres';

async function runMigration() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('Conectado ao banco de dados Supabase.');

        const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260114_create_crm_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executando script SQL do CRM...');
        await client.query(sql);

        console.log('Migração do CRM concluída com sucesso!');
    } catch (err) {
        console.error('Erro ao executar migração:', err);
    } finally {
        await client.end();
    }
}

runMigration();
