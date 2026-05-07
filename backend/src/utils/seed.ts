import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db';
import User from '../models/User';

const seed = async () => {
  await connectDB();
  console.log('Seeding default users...');

  const seedData = [
    { name: 'Admin User', email: 'admin@erp.gov.in', password: 'admin@123', role: 'ADMIN' as const, designation: 'System Administrator' },
    { name: 'Rajesh Kumar', email: 'je@erp.gov.in', password: 'pass@123', role: 'JE' as const, designation: 'Junior Engineer' },
    { name: 'Sunita Sharma', email: 'sdo@erp.gov.in', password: 'pass@123', role: 'SDO' as const, designation: 'Sub-Divisional Officer' },
    { name: 'Anil Verma', email: 'ee@erp.gov.in', password: 'pass@123', role: 'EE' as const, designation: 'Executive Engineer' },
    { name: 'Dr. Mahesh Singh', email: 'ce@erp.gov.in', password: 'pass@123', role: 'CE' as const, designation: 'Chief Engineer' },
    { name: 'Priya Iyer', email: 'tender@erp.gov.in', password: 'pass@123', role: 'TENDER_OFFICER' as const, designation: 'Tender Officer' },
    { name: 'ABC Infra Pvt Ltd', email: 'contractor@abc.com', password: 'pass@123', role: 'CONTRACTOR' as const, companyName: 'ABC Infra Pvt Ltd', gstNumber: '06AABCU9603R1ZJ', panNumber: 'AABCU9603R', registrationNumber: 'REG-2020-1234', experienceYears: 12 },
    { name: 'Treasury Officer', email: 'treasury@erp.gov.in', password: 'pass@123', role: 'TREASURY' as const, designation: 'Treasury Officer' },
    { name: 'Ramesh Gupta', email: 'accounts@erp.gov.in', password: 'pass@123', role: 'ACCOUNTANT' as const, designation: 'Senior Accountant' },
  ];

  for (const u of seedData) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      await User.create(u);
      console.log(`✔ ${u.role}: ${u.email} / ${u.password}`);
    } else {
      console.log(`= ${u.email} already exists`);
    }
  }

  console.log('\nDone. Login with any of the above credentials.');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
