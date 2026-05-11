import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db';

/**
 * Forcibly drops auth + tenancy collections.
 * Uses raw collection.drop() — bypasses Mongoose schema validation.
 * Necessary when old documents have incompatible schemas (e.g., department as string vs ObjectId).
 */
const reset = async () => {
  await connectDB();
  await mongoose.connection.asPromise();
  const db = mongoose.connection.db;
  if (!db) {
    console.error('No DB connection');
    process.exit(1);
  }

  console.log('\n=== Resetting auth + tenancy collections ===');
  console.log(`DB: ${mongoose.connection.name} @ ${mongoose.connection.host}\n`);

  const targets = [
    'users',
    'departments',
    'subscriptions',
    'organizationregistrations',
    'invoices',
    'supportickets',
  ];

  for (const name of targets) {
    try {
      const before = await db.collection(name).countDocuments();
      await db.collection(name).drop();
      console.log(`✔ Dropped "${name}" (had ${before} doc${before !== 1 ? 's' : ''})`);
    } catch (err: any) {
      // 26 = NamespaceNotFound — collection didn't exist, totally fine
      if (err.code === 26 || /ns not found/i.test(err.message)) {
        console.log(`= "${name}" did not exist — skipped`);
      } else {
        console.log(`× "${name}" drop failed: ${err.message}`);
      }
    }
  }

  console.log('\nDone. Now run: npm run seed\n');
  await mongoose.disconnect();
  process.exit(0);
};

reset().catch((e) => { console.error(e); process.exit(1); });
