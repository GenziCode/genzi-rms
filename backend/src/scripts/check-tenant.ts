import mongoose from 'mongoose';
import { TenantSchema } from '../models/tenant.model';

async function checkTenant() {
  const uri = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/genzi-rms';

  console.log('Checking tenant record in master database...');
  console.log(`URI: ${uri}`);

  const connection = await mongoose.createConnection(uri);

  const Tenant = connection.model('Tenant', TenantSchema);

  const tenant = await Tenant.findOne({ subdomain: 'demo' });

  if (!tenant) {
    console.log('❌ Tenant with subdomain "demo" not found');
    await connection.close();
    return;
  }

  console.log('✅ Tenant found:');
  console.log(`  - ID: ${tenant._id}`);
  console.log(`  - Name: ${tenant.name}`);
  console.log(`  - Subdomain: ${tenant.subdomain}`);
  console.log(`  - DB Name: ${tenant.dbName}`);
  console.log(`  - Status: ${tenant.status}`);
  console.log(`  - Subscription Status: ${tenant.subscription.status}`);

  if (!tenant.dbName) {
    console.log('❌ ERROR: Tenant dbName is empty!');
  } else {
    console.log('✅ Tenant dbName is set correctly');
  }

  await connection.close();
}

checkTenant().catch(console.error);
