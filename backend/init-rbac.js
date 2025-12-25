#!/usr/bin/env node

/**
 * Initialize RBAC System
 * Seeds permissions and creates default roles
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Initializing RBAC System...\n');

// Run the migration
const migrationPath = path.join(__dirname, 'src', 'migrations', '001-rbac-initial.ts');

console.log('📝 Running RBAC migration...');
console.log(`   Migration: ${migrationPath}\n`);

exec(`npx ts-node ${migrationPath}`, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Migration failed:', error);
        console.error(stderr);
        process.exit(1);
    }

    console.log(stdout);

    if (stderr) {
        console.error('Warnings:', stderr);
    }

    console.log('\n✅ RBAC System initialized successfully!');
    console.log('\nNext steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Refresh your frontend');
    console.log('  3. Navigate to Roles & Permissions page');
    console.log('  4. Click "Initialize Defaults" to create tenant-specific roles\n');

    process.exit(0);
});
