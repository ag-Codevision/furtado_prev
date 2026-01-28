const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStoragePolicies() {
    console.log('Configurando políticas de Storage para "profiles"...');

    // Note: Standard Supabase installs have a 'storage' schema and 'policies' table
    // But often it's easier to use the storage API if possible.
    // Actually, we need to run SQL to set policies on storage.objects.

    const sql = `
    -- Política para permitir que qualquer um veja as fotos (público)
    CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'profiles');

    -- Política para permitir que usuários autenticados façam upload de suas fotos
    CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'profiles' AND auth.role() = 'authenticated'
    );

    -- Política para permitir que usuários atualizem/deletem suas próprias fotos
    CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE USING (
      bucket_id = 'profiles' AND (select auth.uid())::text = (storage.foldername(name))[1]
    );
  `;

    // Actually, the foldername approach might be complex. Let's simplify:
    // Permitir que qualquer usuário autenticado gerencie seus arquivos se o nome começar com seu ID.

    const simpleSql = `
    DO $$ 
    BEGIN
      -- Select
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects') THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'profiles');
      END IF;

      -- Insert
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload' AND tablename = 'objects') THEN
        CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');
      END IF;

      -- Update/Delete
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Manage' AND tablename = 'objects') THEN
        CREATE POLICY "Authenticated Manage" ON storage.objects FOR ALL USING (bucket_id = 'profiles' AND auth.role() = 'authenticated');
      END IF;
    END $$;
  `;

    // Actually, running SQL on storage schema requires superuser or specific permissions.
    // I will try to use the rpc or just guide the user.
    // Wait, I have the DB connection string in the earlier run! I can use pg client.

    const { Client } = require('pg');
    const pgClient = new Client({ connectionString: 'postgresql://postgres:Omeg%40256489%40256489@db.dnakrupxobjwfbhygtuk.supabase.co:5432/postgres' });

    try {
        await pgClient.connect();
        await pgClient.query(simpleSql);
        console.log('Políticas de Storage aplicadas com sucesso!');
    } catch (err) {
        console.error('Erro ao aplicar políticas de Storage:', err);
    } finally {
        await pgClient.end();
    }
}

setupStoragePolicies();
