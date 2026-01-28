import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: 'public' }
});

async function measurePerformance() {
    console.log('Testing Supabase API performance...\n');
    
    const tests = [
        { name: 'Clients (first 20)', fn: () => supabase.from('clients').select('*', { count: 'exact' }).range(0, 19) },
        { name: 'Team Members', fn: () => supabase.from('team_members').select('*') },
        { name: 'Tasks', fn: () => supabase.from('tasks').select('*') },
        { name: 'Dashboard Stats', fn: () => supabase.from('clients').select('*', { count: 'exact', head: true }) },
    ];

    for (const test of tests) {
        const start = performance.now();
        try {
            const result = await test.fn();
            const end = performance.now();
            const duration = (end - start).toFixed(0);
            const count = result.data?.length || result.count || 0;
            console.log(`✓ ${test.name}: ${duration}ms (${count} records)`);
        } catch (err) {
            const end = performance.now();
            console.log(`✗ ${test.name}: FAILED after ${(end - start).toFixed(0)}ms - ${err.message}`);
        }
    }

    // Test parallel loading (what the app does)
    console.log('\n--- Testing parallel loading (simulating app startup) ---');
    const parallelStart = performance.now();
    await Promise.allSettled(tests.map(t => t.fn()));
    const parallelEnd = performance.now();
    console.log(`Total parallel time: ${(parallelEnd - parallelStart).toFixed(0)}ms`);
}

measurePerformance();
