import mongoose from 'mongoose';
import { UserSchema } from '../models/user.model';
import { UserRole } from '../types';

async function createMasterUser() {
  const uri = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/genzi-rms';

  console.log('Creating user in master database...');
  console.log(`URI: ${uri}`);

  const connection = await mongoose.createConnection(uri);

  const User = connection.model('User', UserSchema);

  // Delete existing user if it exists (to recreate with correct password)
  await User.deleteOne({ email: 'demo@genzi.com' });
  console.log('Deleted existing user (if any)');

  // Create the user (password will be hashed by pre-save hook)
  const user = new User({
    tenantId: '6911d3f171a511b00751b92d', // The tenant ID we found earlier
    email: 'demo@genzi.com',
    password: 'demo123', // Plain text - will be hashed by pre-save hook
    firstName: 'Demo',
    lastName: 'Owner',
    role: UserRole.OWNER,
    permissions: ['*'],
    emailVerified: true,
    status: 'active',
    loginCount: 0,
  });

  await user.save();

  console.log(`✅ User created: ${user.email} (${user.role})`);

  await connection.close();
}

createMasterUser().catch(console.error);
