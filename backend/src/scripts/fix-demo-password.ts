import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function fixDemoPassword() {
  const masterUri = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/genzi-rms';

  logger.info('Fixing demo user password...');

  const connection = await mongoose.createConnection(masterUri);

  // Define User schema inline
  const UserSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    role: String,
    permissions: [String],
    emailVerified: Boolean,
    status: String,
  });

  const User = connection.model('User', UserSchema);

  // Find and update the demo user
  const user = await User.findOne({ email: 'demo@genzi.com' });

  if (!user) {
    logger.error('Demo user not found');
    await connection.close();
    return;
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash('demo123', salt);

  // Update the password
  user.password = hashedPassword;
  await user.save();

  logger.info('✅ Demo user password updated successfully');
  logger.info('Email: demo@genzi.com');
  logger.info('Password: demo123');

  await connection.close();
  process.exit(0);
}

fixDemoPassword().catch((error) => {
  logger.error('Failed to fix demo password:', error);
  process.exit(1);
});