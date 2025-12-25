/**
 * Check Permissions in Database
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://127.0.0.1:27017/genzi-rms';

async function checkPermissions() {
    try {
        console.log('🔍 Checking permissions in database...\n');
        console.log(`   URI: ${MASTER_DB_URI}\n`);

        await mongoose.connect(MASTER_DB_URI);
        console.log('✅ Connected\n');

        const PermissionSchema = new mongoose.Schema({}, { strict: false });
        const Permission = mongoose.model('Permission', PermissionSchema);

        const count = await Permission.countDocuments();
        console.log(`📊 Total permissions: ${count}\n`);

        if (count > 0) {
            const modules = await Permission.distinct('module');
            console.log(`📦 Modules (${modules.length}):`);
            modules.forEach(m => console.log(`   - ${m}`));
            console.log('');

            console.log('📝 Sample permissions:');
            const samples = await Permission.find().limit(5);
            samples.forEach(p => {
                console.log(`   ${p.code} - ${p.name} (${p.module}:${p.action})`);
            });
        } else {
            console.log('⚠️  No permissions found! Run: node seed-permissions.js');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkPermissions();
