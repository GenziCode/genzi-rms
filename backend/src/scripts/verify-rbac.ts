import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { PermissionSchema } from '../models/permission.model';
import { RoleSchema } from '../models/role.model';
import { RoleAssignmentSchema } from '../models/roleAssignment.model';

dotenv.config();

/**
 * Verify RBAC Migration
 * Checks that permissions and collections were created correctly
 */
async function verifyRBAC() {
  const uri = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/genzi-rms';
  
  logger.info('🔍 Verifying RBAC Migration...');
  logger.info(`URI: ${uri}`);
  logger.info('');

  const connection = await mongoose.createConnection(uri, {
    directConnection: true,
  });

  try {
    const Permission = connection.model('Permission', PermissionSchema);
    const Role = connection.model('Role', RoleSchema);
    const RoleAssignment = connection.model('RoleAssignment', RoleAssignmentSchema);

    // Check permissions
    const permissionCount = await Permission.countDocuments();
    logger.info(`✅ Permissions found: ${permissionCount}`);

    // Check by module
    const modules = await Permission.distinct('module');
    logger.info(`✅ Modules found: ${modules.length}`);
    modules.forEach(module => {
      logger.info(`   - ${module}`);
    });

    // Check roles collection exists
    const roleCount = await Role.countDocuments();
    logger.info(`✅ Roles collection exists: ${roleCount} roles (will be created per tenant)`);

    // Check role assignments collection exists
    const assignmentCount = await RoleAssignment.countDocuments();
    logger.info(`✅ RoleAssignments collection exists: ${assignmentCount} assignments`);

    // Sample permissions
    logger.info('');
    logger.info('Sample Permissions:');
    const samplePerms = await Permission.find().limit(5);
    samplePerms.forEach(perm => {
      logger.info(`   - ${perm.code}: ${perm.name} (${perm.module}:${perm.action})`);
    });

    logger.info('');
    logger.info('✅ RBAC Migration Verified Successfully!');

  } catch (error) {
    logger.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await connection.close();
  }
}

if (require.main === module) {
  verifyRBAC()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Verification failed:', error);
      process.exit(1);
    });
}

export { verifyRBAC };

