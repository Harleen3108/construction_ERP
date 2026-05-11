import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db';
import User from '../models/User';
import Department from '../models/Department';
import Subscription from '../models/Subscription';

const seed = async () => {
  await connectDB();
  console.log('Seeding Constructor ERP...\n');

  // 1. Sample department
  let dept = await Department.findOne({ code: 'HRY-PWD-001' });
  if (!dept) {
    dept = await Department.create({
      name: 'Haryana Public Works Department',
      code: 'HRY-PWD-001',
      type: 'PWD',
      state: 'Haryana',
      city: 'Chandigarh',
      address: 'Mini Secretariat, Sector 17, Chandigarh',
      contactEmail: 'pwd-hr@gov.in',
      contactPhone: '+91-172-2700000',
      headOfDepartment: 'Dr. Mahesh Singh, IAS',
      enabledModules: ['etender', 'erp', 'finance', 'mb', 'reports'],
      status: 'ACTIVE',
    });
    console.log(`✔ Department created: ${dept.name} (${dept.code})`);
  } else {
    console.log(`= Department exists: ${dept.code}`);
  }

  // 2. Subscription
  const sub = await Subscription.findOne({ department: dept._id, status: 'ACTIVE' });
  if (!sub) {
    await Subscription.create({
      department: dept._id,
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      billingCycle: 'YEARLY',
      amount: 499000,
      modules: ['etender', 'erp', 'finance', 'mb', 'reports'],
      maxUsers: 100,
      maxProjects: 500,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    console.log('✔ Subscription created (Professional plan, 1 year)');
  }

  // 3. Users — 8 roles
  const seedData = [
    { name: 'System Super Admin', email: 'superadmin@erp.gov.in', password: 'super@123',
      role: 'SUPER_ADMIN' as const, designation: 'Platform Administrator' },

    { name: 'Department Admin', email: 'deptadmin@erp.gov.in', password: 'dept@123',
      role: 'DEPT_ADMIN' as const, designation: 'PWD Department Admin', department: dept._id },

    { name: 'Dr. Mahesh Singh', email: 'ce@erp.gov.in', password: 'pass@123',
      role: 'CE' as const, designation: 'Chief Engineer', department: dept._id },

    { name: 'Anil Verma', email: 'ee@erp.gov.in', password: 'pass@123',
      role: 'EE' as const, designation: 'Executive Engineer', department: dept._id },

    { name: 'Sunita Sharma', email: 'sdo@erp.gov.in', password: 'pass@123',
      role: 'SDO' as const, designation: 'Sub-Divisional Officer / Assistant Engineer', department: dept._id },

    { name: 'Rajesh Kumar', email: 'je@erp.gov.in', password: 'pass@123',
      role: 'JE' as const, designation: 'Junior Engineer', department: dept._id },

    { name: 'Ramesh Gupta', email: 'accounts@erp.gov.in', password: 'pass@123',
      role: 'ACCOUNTANT' as const, designation: 'Senior Accountant / Treasury', department: dept._id },

    { name: 'ABC Infra Pvt Ltd', email: 'contractor@abc.com', password: 'pass@123',
      role: 'CONTRACTOR' as const, companyName: 'ABC Infra Pvt Ltd',
      gstNumber: '06AABCU9603R1ZJ', panNumber: 'AABCU9603R',
      registrationNumber: 'REG-2020-1234', experienceYears: 12,
      contractorVerified: true },
  ];

  for (const u of seedData) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      await User.create(u);
      console.log(`✔ ${u.role.padEnd(13)} ${u.email.padEnd(28)} / ${u.password}`);
    } else {
      console.log(`= ${u.role.padEnd(13)} ${u.email.padEnd(28)} already exists`);
    }
  }

  console.log('\n=== Login Credentials ===');
  console.log('Super Admin:  superadmin@erp.gov.in / super@123');
  console.log('Dept Admin:   deptadmin@erp.gov.in  / dept@123');
  console.log('CE:           ce@erp.gov.in         / pass@123');
  console.log('EE:           ee@erp.gov.in         / pass@123');
  console.log('SDO:          sdo@erp.gov.in        / pass@123');
  console.log('JE:           je@erp.gov.in         / pass@123');
  console.log('Accountant:   accounts@erp.gov.in   / pass@123');
  console.log('Contractor:   contractor@abc.com    / pass@123');
  console.log('\nDone.\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
