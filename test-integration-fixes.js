/**
 * Test Script for Backend-Frontend Integration Fixes
 * 
 * This script tests the newly added/fixed endpoints
 * Run this after logging in to get a valid token
 */

// Configuration
const API_URL = 'http://localhost:5000/api';
const TENANT = 'your-tenant-subdomain'; // Replace with your tenant
const TOKEN = 'your-access-token'; // Replace with your access token after login

// Helper function to make API calls
async function testEndpoint(method, endpoint, description, body = null) {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`   ${method} ${endpoint}`);

    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`,
                'X-Tenant': TENANT,
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();

        if (response.ok) {
            console.log(`   ✅ SUCCESS (${response.status})`);
            console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
        } else {
            console.log(`   ❌ FAILED (${response.status})`);
            console.log(`   Error:`, data.message || data.error);
        }

        return { success: response.ok, status: response.status, data };
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Test Suite
async function runTests() {
    console.log('========================================');
    console.log('🧪 Backend-Frontend Integration Tests');
    console.log('========================================');

    // Test 1: Product Search (Fixed)
    await testEndpoint(
        'GET',
        '/products?search=test',
        'Product Search (Fixed endpoint)'
    );

    // Test 2: Product Stats (New endpoint)
    await testEndpoint(
        'GET',
        '/products/stats',
        'Product Statistics (New endpoint)'
    );

    // Test 3: Product by Barcode (New endpoint)
    await testEndpoint(
        'GET',
        '/products/barcode/123456789',
        'Get Product by Barcode (New endpoint)'
    );

    // Test 4: Product by QR Code (New GET endpoint)
    await testEndpoint(
        'GET',
        '/products/qr/SKU-001',
        'Get Product by QR Code (New GET endpoint)'
    );

    // Test 5: Stores - Get All (New service)
    await testEndpoint(
        'GET',
        '/stores',
        'Get All Stores (New frontend service)'
    );

    // Test 6: Health Check
    await testEndpoint(
        'GET',
        '/health',
        'API Health Check'
    );

    console.log('\n========================================');
    console.log('✅ Test Suite Completed');
    console.log('========================================\n');
}

// Instructions
console.log(`
📋 INSTRUCTIONS:
1. Log in to your application to get a valid access token
2. Update the TOKEN and TENANT variables in this script
3. Run: node test-integration-fixes.js
4. Check the results for each endpoint

Note: Some endpoints may return 404 if no data exists yet.
This is normal - the important thing is that the endpoints respond correctly.
`);

// Uncomment to run tests (after setting TOKEN and TENANT)
// runTests();
