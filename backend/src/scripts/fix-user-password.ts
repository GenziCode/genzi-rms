import mongoose from 'mongoose';
import { UserSchema } from '../models/user.model';

async function fixUserPassword() {
  const uri = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/genzi-rms';

  console.log('Fixing user password in master database...');
  console.log(`URI: ${uri}`);

  const connection = await mongoose.createConnection(uri);

  const User = connection.model('User', UserSchema);

  const result = await User.updateOne(
    { email: 'demo@genzi.com' },
    { $set: { password: '$2a$10$i/COWh5BEkzltaYArfVbGelpj93YsFf/nCA26gI608Kip8ohbshuK' } }
  );

  console.log(`Updated ${result.modifiedCount} user(s)`);

  await connection.close();
}

fixUserPassword().catch(console.error);
