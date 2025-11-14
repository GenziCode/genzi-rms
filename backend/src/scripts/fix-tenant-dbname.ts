import mongoose from 'mongoose';
import { TenantSchema } from '../models/tenant.model';

async function fixTenantDbName() {
  const uri = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/genzi-rms';

  console.log('Fixing tenant dbName to match sample database...');
  console.log(`URI: ${uri}`);

  const connection = await mongoose.createConnection(uri);

  const Tenant = connection.model('Tenant', TenantSchema);

  const result = await Tenant.updateOne(
    { subdomain: 'demo' },
    { $set: { dbName: 'tenant_sample_demo' } }
  );

  if (result.modifiedCount > 0) {
    console.log('✅ Tenant dbName updated to "tenant_sample_demo"');
  } else {
    console.log('ℹ️  Tenant dbName was already correct or tenant not found');
  }

  // Verify the fix
  const tenant = await Tenant.findOne({ subdomain: 'demo' });
  if (tenant) {
    console.log(`Current dbName: ${tenant.dbName}`);
  }

  await connection.close();
}

fixTenantDbName().catch(console.error);
