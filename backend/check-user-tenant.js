/**
 * Check User Tenant
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MASTER_DB_URI = process.env.MASTER_DB_URI || 'mongodb://127.0.0.1:27017/genzi-rms';

async function checkUserTenant() {
    try {
        console.log('🔍 Checking user tenant...\n');

        await mongoose.connect(MASTER_DB_URI);
        console.log('✅ Connected\n');

        const UserSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.model('User', UserSchema);
        const TenantSchema = new mongoose.Schema({}, { strict: false });
        const Tenant = mongoose.model('Tenant', TenantSchema);

        const user = await User.findOne({ email: 'haseeb@genzi-rms.com' });

        if (user) {
            console.log(`👤 User found: ${user.email}`);
            console.log(`   Tenant ID: ${user.tenantId}`);

            const tenant = await Tenant.findById(user.tenantId);
            if (tenant) {
                console.log(`   Tenant Name: ${tenant.name}`);
                console.log(`   Subdomain: ${tenant.subdomain}`);
            } else {
                console.log('   ⚠️ Tenant not found for this user!');
            }
        } else {
            console.log('❌ User not found!');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkUserTenant();
