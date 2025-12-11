// Diagnostic script to check backend status
const http = require('http');

console.log('🔍 Checking backend server status...\n');

// Check if port 4000 is responding
const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/health',
    method: 'GET',
    timeout: 3000,
};

const req = http.request(options, (res) => {
    console.log(`✅ Backend is responding!`);
    console.log(`   Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`   Response: ${data}\n`);

        // Now test the discovery endpoint
        testDiscoveryEndpoint();
    });
});

req.on('error', (error) => {
    console.error('❌ Backend server is NOT running!');
    console.error(`   Error: ${error.message}\n`);
    console.log('💡 To fix this:');
    console.log('   1. Open PowerShell');
    console.log('   2. cd c:\\Users\\Administrator\\Documents\\Lifeline\\backend');
    console.log('   3. npm run dev');
    console.log('   4. Wait for "Server running on port 4000" message\n');
});

req.on('timeout', () => {
    console.error('❌ Backend server timed out (not responding)');
    req.destroy();
});

req.end();

function testDiscoveryEndpoint() {
    console.log('🔍 Testing discovery endpoint...\n');

    const discOptions = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/discover/creators?tab=for-you&limit=3',
        method: 'GET',
        timeout: 3000,
    };

    const discReq = http.request(discOptions, (res) => {
        console.log(`   Discovery endpoint status: ${res.statusCode}`);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log(`   ✅ Creators returned: ${json.creators?.length || 0}`);
                console.log(`   Total in database: ${json.total || 0}\n`);

                if (json.creators && json.creators.length > 0) {
                    console.log('🎉 Backend integration is working!');
                    console.log('   Refresh the discovery page to see real creators.\n');
                } else {
                    console.log('⚠️  No creators in database.');
                    console.log('   Run: npx ts-node src/scripts/seed-creators.ts\n');
                }
            } catch (e) {
                console.error('   ❌ Invalid JSON response:', data.substring(0, 100));
            }
        });
    });

    discReq.on('error', (error) => {
        console.error(`   ❌ Discovery endpoint error: ${error.message}`);
    });

    discReq.end();
}
