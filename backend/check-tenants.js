/**
 * Check Tenants in Database
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://127.0.0.1:27017/genzi-rms';

async function checkTenants() {
    try {
        console.log('🔍 Checking tenants in database...\n');
        console.log(`   URI: ${MASTER_DB_URI}\n`);

        await mongoose.connect(MASTER_DB_URI);
        console.log('✅ Connected\n');

        const TenantSchema = new mongoose.Schema({}, { strict: false });
        const Tenant = mongoose.model('Tenant', TenantSchema);

        const count = await Tenant.countDocuments();
        console.log(`📊 Total tenants: ${count}\n`);

        if (count > 0) {
            const tenants = await Tenant.find();
            tenants.forEach(t => {
                console.log(`   ID: ${t._id}`);
                console.log(`   Name: ${t.name}`);
                console.log(`   Subdomain: ${t.subdomain}`);
                console.log(`   Status: ${t.status}`);
                console.log('---');
            });
        } else {
            console.log('⚠️  No tenants found!');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkTenants();
