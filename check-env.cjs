const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
console.log('--- .env.local HEX DUMP ---');
for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const hex = char.charCodeAt(0).toString(16).padStart(2, '0');
    process.stdout.write(`${char}(${hex}) `);
    if (char === '\n') console.log('');
}
console.log('\n--- END DUMP ---');
console.log('Total characters:', content.length);
