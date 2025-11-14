import mongoose from 'mongoose';
import { UserSchema } from '../models/user.model';
import { UserRole } from '../types';

async function createTenantUser() {
  const uri = 'mongodb://localhost:27017/tenant_sample_demo';

  console.log('Creating user in tenant database...');
  console.log(`URI: ${uri}`);

  const connection = await mongoose.createConnection(uri);

  const User = connection.model('User', UserSchema);

  // Check if user already exists
  const existingUser = await User.findOne({ email: 'demo@genzi.com' });
  if (existingUser) {
    console.log('✅ User already exists');
    await connection.close();
    return;
  }

  // Create the user
  const user = await User.create({
    email: 'demo@genzi.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "demo123"
    firstName: 'Demo',
    lastName: 'Owner',
    role: UserRole.OWNER,
    permissions: ['*'],
    emailVerified: true,
    status: 'active',
    tenantId: '6911d3f171a511b00751b92d', // The tenant ID we found earlier
  });

  console.log(`✅ User created: ${user.email} (${user.role})`);

  await connection.close();
}

createTenantUser().catch(console.error);
