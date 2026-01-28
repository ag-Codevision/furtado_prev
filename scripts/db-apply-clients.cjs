const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.includes('='))
        .map(line => {
            const [key, ...val] = line.split('=');
            return [key.trim(), val.join('=').trim()];
        })
);

const pgUrl = 'postgresql://postgres:Omeg%40256489%40256489@db.dnakrupxobjwfbhygtuk.supabase.co:5432/postgres';

async function applyMigration() {
    console.log('Lendo arquivo de migração...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260114_create_clients_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Conectando ao PostgreSQL...');
    const pgClient = new Client({ connectionString: pgUrl });

    try {
        await pgClient.connect();
        console.log('Aplicando migração (criando tabela clients)...');
        await pgClient.query(sql);
        console.log('Tabela clients criada com sucesso!');
    } catch (err) {
        console.error('Erro ao aplicar migração:', err);
    } finally {
        await pgClient.end();
    }
}

applyMigration();
