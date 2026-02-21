require('dotenv').config();
const fs = require('fs');

async function test() {
    try {
        const { execSync } = require('child_process');
        const output = execSync('node src/scripts/seed.js', { encoding: 'utf8' });
        fs.writeFileSync('seed-real-out.txt', output);
        console.log("Success");
    } catch (e) {
        fs.writeFileSync('seed-real-out.txt', e.stdout + '\n' + e.stderr + '\n' + e.message);
        console.log("Failed");
    }
}
test();
