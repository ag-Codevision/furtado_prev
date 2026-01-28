const url = 'https://pykmbdflkismnsmckyit.supabase.co/rest/v1/clients?select=count';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5a21iZGZsa2lzbW5zbWNreWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDM0NDEsImV4cCI6MjA3OTMxOTQ0MX0.PZKcuOEXRAWfWO7zg0dPI_3onFy8WXvxst46pOxf6uU';

async function test() {
    console.log(`Testing OTHER project: ${url}`);
    try {
        const response = await fetch(url, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
            signal: AbortSignal.timeout(5000)
        });
        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log('Result:', data);
    } catch (err) {
        console.error('Failed:', err.message);
    }
}
test();
