import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db';
import Department from '../models/Department';
import User from '../models/User';
import Subscription from '../models/Subscription';
import OrganizationRegistration from '../models/OrganizationRegistration';

/**
 * Cleans orphaned records left behind when departments were manually
 * deleted from MongoDB without a cascade.
 *
 * Run:  npm run cleanup
 */
const cleanupOrphans = async () => {
  await connectDB();
  console.log('\n=== Cleaning Orphaned Records ===\n');

  // Get all current department IDs
  const depts = await Department.find().select('_id').lean();
  const deptIds = depts.map((d) => d._id);
  console.log(`Found ${deptIds.length} live department(s) in DB`);

  // 1. Orphaned APPROVED registrations (their department no longer exists)
  const orphanRegs = await OrganizationRegistration.deleteMany({
    status: 'APPROVED',
    $or: [
      { department: { $exists: false } },
      { department: null },
      { department: { $nin: deptIds } },
    ],
  });
  console.log(`✔ Removed ${orphanRegs.deletedCount} orphaned approved registrations`);

  // 2. Orphaned DEPT_ADMIN users whose department is gone
  const orphanAdmins = await User.deleteMany({
    role: 'DEPT_ADMIN',
    $or: [
      { department: { $exists: false } },
      { department: null },
      { department: { $nin: deptIds } },
    ],
  });
  console.log(`✔ Removed ${orphanAdmins.deletedCount} orphaned DEPT_ADMIN users`);

  // 3. Orphaned subscriptions
  const orphanSubs = await Subscription.deleteMany({
    $or: [
      { department: { $exists: false } },
      { department: null },
      { department: { $nin: deptIds } },
    ],
  });
  console.log(`✔ Removed ${orphanSubs.deletedCount} orphaned subscriptions`);

  // 4. Orphaned non-admin users whose department is gone (CE/EE/SDO/JE/ACCOUNTANT)
  const orphanOtherUsers = await User.deleteMany({
    role: { $in: ['CE', 'EE', 'SDO', 'JE', 'ACCOUNTANT'] },
    $or: [
      { department: { $exists: false } },
      { department: null },
      { department: { $nin: deptIds } },
    ],
  });
  console.log(`✔ Removed ${orphanOtherUsers.deletedCount} orphaned department users`);

  console.log('\n=== Done ===\n');
  await mongoose.disconnect();
  process.exit(0);
};

cleanupOrphans().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
