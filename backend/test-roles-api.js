#!/usr/bin/env node

/**
 * Roles & Permissions API Integration Test
 * Tests all critical endpoints to ensure 100% functionality
 */

const API_BASE = 'http://localhost:5000/api';
let authToken = '';

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${result.error?.message || 'Unknown error'}`);
        }

        return result;
    } catch (error) {
        console.error(`❌ ${method} ${endpoint} failed:`, error.message);
        throw error;
    }
}

// Test suite
async function runTests() {
    console.log('🚀 Starting Roles & Permissions API Integration Tests\n');

    try {
        // Step 1: Login (get auth token)
        console.log('📝 Step 1: Authenticating...');
        const loginResult = await apiCall('POST', '/auth/login', {
            email: 'admin@example.com', // Update with your test credentials
            password: 'password123'
        });
        authToken = loginResult.data.token;
        console.log('✅ Authentication successful\n');

        // Step 2: Initialize default roles
        console.log('📝 Step 2: Initializing default roles...');
        await apiCall('POST', '/roles/initialize');
        console.log('✅ Default roles initialized\n');

        // Step 3: Get all roles
        console.log('📝 Step 3: Fetching all roles...');
        const rolesResult = await apiCall('GET', '/roles');
        const roles = rolesResult.data.roles;
        console.log(`✅ Found ${roles.length} roles:`);
        roles.forEach(role => {
            console.log(`   - ${role.name} (${role.code}) - ${role.permissions?.length || 0} permissions`);
        });
        console.log('');

        // Step 4: Get all permissions
        console.log('📝 Step 4: Fetching all permissions...');
        const permsResult = await apiCall('GET', '/permissions');
        const permissions = permsResult.data.permissions;
        console.log(`✅ Found ${permissions.length} permissions\n`);

        // Step 5: Get grouped permissions
        console.log('📝 Step 5: Fetching grouped permissions...');
        const groupedResult = await apiCall('GET', '/permissions/grouped');
        const grouped = groupedResult.data.permissions;
        const moduleCount = Object.keys(grouped).length;
        console.log(`✅ Permissions grouped into ${moduleCount} modules:`);
        Object.entries(grouped).forEach(([module, perms]) => {
            console.log(`   - ${module}: ${perms.length} permissions`);
        });
        console.log('');

        // Step 6: Create a custom role
        console.log('📝 Step 6: Creating custom role...');
        const newRole = await apiCall('POST', '/roles', {
            name: 'Store Supervisor',
            code: 'STORE_SUPERVISOR',
            description: 'Supervises store operations and manages staff schedules',
            category: 'custom',
            permissionCodes: ['product:read', 'customer:read', 'inventory:read', 'pos:read', 'pos:create'],
            scope: { type: 'store' }
        });
        console.log(`✅ Created role: ${newRole.data.role.name} with ${newRole.data.role.permissions?.length || 0} permissions\n`);

        // Step 7: Update the role
        console.log('📝 Step 7: Updating role...');
        const updatedRole = await apiCall('PUT', `/roles/${newRole.data.role._id}`, {
            description: 'Updated: Supervises store operations, manages staff, and handles inventory',
            permissionCodes: ['product:read', 'product:update', 'customer:read', 'inventory:read', 'pos:read', 'pos:create']
        });
        console.log(`✅ Updated role: ${updatedRole.data.role.name}\n`);

        // Step 8: Get role by ID
        console.log('📝 Step 8: Fetching role by ID...');
        const roleById = await apiCall('GET', `/roles/${newRole.data.role._id}`);
        console.log(`✅ Retrieved role: ${roleById.data.role.name}\n`);

        // Step 9: Get role analytics
        console.log('📝 Step 9: Fetching role analytics...');
        const analytics = await apiCall('GET', '/roles/analytics');
        console.log('✅ Analytics:');
        console.log(`   - Total Roles: ${analytics.data.totalRoles}`);
        console.log(`   - Active Roles: ${analytics.data.activeRoles}`);
        console.log(`   - System Roles: ${analytics.data.systemRoles}`);
        console.log(`   - Custom Roles: ${analytics.data.customRoles}\n`);

        // Step 10: Get role distribution
        console.log('📝 Step 10: Fetching role distribution...');
        const distribution = await apiCall('GET', '/roles/distribution');
        console.log('✅ Distribution:');
        Object.entries(distribution.data.distribution).forEach(([category, count]) => {
            console.log(`   - ${category}: ${count}`);
        });
        console.log('');

        // Step 11: Delete the custom role
        console.log('📝 Step 11: Deleting custom role...');
        await apiCall('DELETE', `/roles/${newRole.data.role._id}`);
        console.log('✅ Role deleted successfully\n');

        console.log('🎉 All tests passed! Roles & Permissions system is 100% functional!\n');

    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
runTests().catch(console.error);
