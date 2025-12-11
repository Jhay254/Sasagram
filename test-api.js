// Quick test script to verify discovery API
const API_BASE = 'http://localhost:4000/api';

async function testDiscoveryAPI() {
    console.log('🧪 Testing Discovery API...\n');

    try {
        console.log('1. Testing /api/discover/creators endpoint...');
        const response = await fetch(`${API_BASE}/discover/creators?tab=for-you&limit=5`);

        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`   ❌ Error response:`, errorText);
            return;
        }

        const data = await response.json();
        console.log(`   ✅ Success!`);
        console.log(`   Creators returned: ${data.creators?.length || 0}`);
        console.log(`   Has more: ${data.hasMore}`);
        console.log(`   Total: ${data.total}\n`);

        if (data.creators && data.creators.length > 0) {
            console.log('   First creator:');
            const creator = data.creators[0];
            console.log(`   - Username: ${creator.username}`);
            console.log(`   - Display Name: ${creator.displayName}`);
            console.log(`   - Bio: ${creator.bio?.substring(0, 50)}...`);
            console.log(`   - Subscribers: ${creator.subscriberCount}`);
        } else {
            console.log('   ⚠️  No creators returned (database might be empty)');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('   Make sure the backend server is running on port 4000');
    }
}

testDiscoveryAPI();
