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

        const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260117_create_decisions_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executando script SQL para tabela de sentenças...');
        await client.query(sql);

        console.log('Migração concluída com sucesso! Tabela decisions criada.');
    } catch (err) {
        console.error('Erro ao executar migração:', err);
    } finally {
        await client.end();
    }
}

runMigration();
