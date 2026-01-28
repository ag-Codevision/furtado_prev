import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pykmbdflkismnsmckyit.supabase.co';
const supabaseAnonKey = 'sb_publishable_BQCV2GKiEOHm9mVtQIsszw_NpPQq8Ln'; // Using same key to see if it's the key or URL

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log(`Testing connection to OTHER project: ${supabaseUrl}`);
    const { data, error } = await supabase.from('clients').select('count', { count: 'exact', head: true });
    if (error) {
        console.log('Connection failed (Expected if key is wrong):', error.message);
    } else {
        console.log('Connection successful to other project!');
    }
}

test();
