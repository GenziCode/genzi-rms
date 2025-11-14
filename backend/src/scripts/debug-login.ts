import mongoose from 'mongoose';
import { UserSchema } from '../models/user.model';
import bcrypt from 'bcryptjs';

async function debugLogin() {
  const uri = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/genzi-rms';

  console.log('Debugging login process...');
  console.log(`URI: ${uri}`);

  const connection = await mongoose.createConnection(uri);

  const User = connection.model('User', UserSchema);

  // Find user
  const user = await User.findOne({ email: 'demo@genzi.com' }).select('+password');
  console.log('User found:', !!user);

  if (user) {
    console.log('User email:', user.email);
    console.log('User status:', user.status);
    console.log('User role:', user.role);
    console.log('User tenantId:', user.tenantId);
    console.log('Password hash exists:', !!user.password);
    console.log('Password hash:', user.password);

    // Test password
    const passwordMatch = await user.comparePassword('demo123');
    console.log('Password match:', passwordMatch);

    // Manual bcrypt check
    const manualMatch = await bcrypt.compare('demo123', user.password);
    console.log('Manual bcrypt match:', manualMatch);

    // Test with the hash we generated earlier
    const testHash = '$2a$10$i/COWh5BEkzltaYArfVbGelpj93YsFf/nCA26gI608Kip8ohbshuK';
    const testMatch = await bcrypt.compare('demo123', testHash);
    console.log('Test hash match:', testMatch);
  }

  await connection.close();
}

debugLogin().catch(console.error);
