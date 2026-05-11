import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * 8 roles in strict hierarchy (per the Govt PWD spec):
 *   SUPER_ADMIN  → onboards departments, manages SaaS subscriptions, modules
 *   DEPT_ADMIN   → manages users, contractors, permissions, tenders, projects within department
 *   CE           → Chief Engineer — high-level approvals, budgets, monitoring
 *   EE           → Executive Engineer — manages tenders, approves projects/MBs/bills, work orders
 *   SDO          → SDO / Assistant Engineer — verifies site, measurements, forwards to EE
 *   JE           → Junior Engineer — proposals, MB entries, daily progress
 *   CONTRACTOR   → registers, bids, executes, raises bills
 *   ACCOUNTANT   → verifies deductions, processes payments, financial records
 */
export type UserRole =
  | 'SUPER_ADMIN'
  | 'DEPT_ADMIN'
  | 'CE'
  | 'EE'
  | 'SDO'
  | 'JE'
  | 'CONTRACTOR'
  | 'ACCOUNTANT';

export interface IPermissions {
  canCreateProject?: boolean;
  canApproveProject?: boolean;
  canCreateTender?: boolean;
  canApproveTender?: boolean;
  canEvaluateBids?: boolean;
  canIssueWorkOrder?: boolean;
  canRecordMB?: boolean;
  canApproveMB?: boolean;
  canRaiseBill?: boolean;
  canApproveBill?: boolean;
  canReleasePayment?: boolean;
  canManageUsers?: boolean;
  canViewAuditLogs?: boolean;
  canManageBudget?: boolean;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: mongoose.Types.ObjectId;
  phone?: string;
  designation?: string;
  employeeId?: string;
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;
  registrationNumber?: string;
  experienceYears?: number;
  contractorVerified?: boolean;
  permissions: IPermissions;
  active: boolean;
  avatar?: string;
  lastLoginAt?: Date;
  passwordSetToken?: string;
  passwordSetExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  mustSetPassword?: boolean;
  matchPassword(entered: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const permissionsSchema = new Schema<IPermissions>(
  {
    canCreateProject: Boolean,
    canApproveProject: Boolean,
    canCreateTender: Boolean,
    canApproveTender: Boolean,
    canEvaluateBids: Boolean,
    canIssueWorkOrder: Boolean,
    canRecordMB: Boolean,
    canApproveMB: Boolean,
    canRaiseBill: Boolean,
    canApproveBill: Boolean,
    canReleasePayment: Boolean,
    canManageUsers: Boolean,
    canViewAuditLogs: Boolean,
    canManageBudget: Boolean,
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String, required: true, unique: true,
      lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['SUPER_ADMIN','DEPT_ADMIN','CE','EE','SDO','JE','CONTRACTOR','ACCOUNTANT'],
      required: true,
    },
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    phone: String,
    designation: String,
    employeeId: String,
    companyName: String,
    gstNumber: String,
    panNumber: String,
    registrationNumber: String,
    experienceYears: Number,
    contractorVerified: { type: Boolean, default: false },
    permissions: { type: permissionsSchema, default: () => ({}) },
    active: { type: Boolean, default: true },
    avatar: String,
    lastLoginAt: Date,
    passwordSetToken: { type: String, select: false },
    passwordSetExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    mustSetPassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isNew || this.isModified('role')) {
    this.permissions = defaultPermissions(this.role) as any;
  }
  next();
});

userSchema.methods.matchPassword = async function (entered: string) {
  return await bcrypt.compare(entered, this.password);
};

function defaultPermissions(role: UserRole): IPermissions {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        canCreateProject: true, canApproveProject: true,
        canCreateTender: true, canApproveTender: true,
        canEvaluateBids: true, canIssueWorkOrder: true,
        canRecordMB: true, canApproveMB: true,
        canRaiseBill: true, canApproveBill: true,
        canReleasePayment: true, canManageUsers: true,
        canViewAuditLogs: true, canManageBudget: true,
      };
    case 'DEPT_ADMIN':
      return { canManageUsers: true, canViewAuditLogs: true, canManageBudget: true,
               canCreateTender: true, canApproveTender: true };
    case 'CE':
      return { canApproveProject: true, canApproveTender: true, canApproveBill: true,
               canManageBudget: true, canViewAuditLogs: true };
    case 'EE':
      return { canApproveProject: true, canCreateTender: true, canApproveTender: true,
               canEvaluateBids: true, canIssueWorkOrder: true, canApproveMB: true,
               canApproveBill: true };
    case 'SDO':
      return { canApproveMB: true, canApproveBill: true };
    case 'JE':
      return { canCreateProject: true, canRecordMB: true };
    case 'CONTRACTOR':
      return { canRaiseBill: true };
    case 'ACCOUNTANT':
      return { canApproveBill: true, canReleasePayment: true, canViewAuditLogs: true };
    default:
      return {};
  }
}

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
