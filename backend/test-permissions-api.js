/**
 * Test Permissions API
 * Tests if permissions are being returned correctly
 */

const fetch = require('node-fetch');

async function testPermissionsAPI() {
    try {
        console.log('🧪 Testing Permissions API...\n');

        // Test 1: Get all permissions
        console.log('1️⃣ Testing GET /api/permissions');
        const response1 = await fetch('http://localhost:5000/api/permissions');
        const data1 = await response1.json();
        console.log('   Status:', response1.status);
        console.log('   Response structure:', Object.keys(data1));
        if (data1.data) {
            console.log('   Permissions count:', data1.data.permissions?.length || 0);
        }
        console.log('');

        // Test 2: Get grouped permissions
        console.log('2️⃣ Testing GET /api/permissions/grouped');
        const response2 = await fetch('http://localhost:5000/api/permissions/grouped');
        const data2 = await response2.json();
        console.log('   Status:', response2.status);
        console.log('   Response structure:', Object.keys(data2));
        if (data2.data) {
            console.log('   Data structure:', Object.keys(data2.data));
            if (data2.data.permissions) {
                console.log('   Modules:', Object.keys(data2.data.permissions));
                console.log('   Module count:', Object.keys(data2.data.permissions).length);

                // Show first module
                const firstModule = Object.keys(data2.data.permissions)[0];
                if (firstModule) {
                    console.log(`   ${firstModule} permissions:`, data2.data.permissions[firstModule].length);
                }
            }
        }
        console.log('');

        console.log('✅ API test complete!');
        console.log('\nFull response for grouped:');
        console.log(JSON.stringify(data2, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testPermissionsAPI();
