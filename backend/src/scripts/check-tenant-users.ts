import mongoose from 'mongoose';
import { UserSchema } from '../models/user.model';

async function checkTenantUsers() {
  const uri = 'mongodb://localhost:27017/tenant_sample_demo';

  console.log('Checking users in tenant database...');
  console.log(`URI: ${uri}`);

  const connection = await mongoose.createConnection(uri);

  const User = connection.model('User', UserSchema);

  const users = await User.find({});

  console.log(`Found ${users.length} users:`);

  users.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.email} (${user.role}) - Active: ${user.status === 'active'}`);
  });

  await connection.close();
}

checkTenantUsers().catch(console.error);
