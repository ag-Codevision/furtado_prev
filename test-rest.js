import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/clients?select=count`;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log(`Testing REST API: ${url}`);

async function test() {
    try {
        const response = await fetch(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        const data = await response.json();
        console.log('Data:', data);
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

test();
