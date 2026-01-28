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

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
    console.log('Verificando buckets de storage...');

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('Erro ao listar buckets:', listError);
        return;
    }

    const bucketExists = buckets.find(b => b.id === 'profiles');

    if (!bucketExists) {
        console.log('Criando bucket "profiles"...');
        const { error: createError } = await supabase.storage.createBucket('profiles', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            fileSizeLimit: 2 * 1024 * 1024 // 2MB
        });

        if (createError) {
            console.error('Erro ao criar bucket:', createError);
        } else {
            console.log('Bucket "profiles" criado com sucesso!');
        }
    } else {
        console.log('Bucket "profiles" já existe.');
    }
}

setupStorage();
