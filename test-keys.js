import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/clients?limit=1`;
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function test() {
    try {
        const response = await fetch(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        const data = await response.json();
        console.log('Keys of first client:', Object.keys(data[0] || {}));
        console.log('Full first client data:', data[0]);
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

test();
