import mongoose, { Schema, Document } from 'mongoose';

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';

export interface IOrganizationRegistration extends Document {
  // Organization details
  orgName: string;
  code: string;
  type: string;
  state: string;
  city: string;
  address?: string;
  contactEmail: string;
  contactPhone?: string;
  headOfDepartment?: string;
  website?: string;
  // Admin user
  adminName: string;
  adminEmail: string;
  adminPhone?: string;
  adminDesignation?: string;
  // Requested
  requestedModules?: string[];
  expectedUsers?: number;
  expectedProjects?: number;
  preferredPlan?: string;
  notes?: string;
  // Status & review
  status: RegistrationStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  // Once approved
  department?: mongoose.Types.ObjectId;
  subscription?: mongoose.Types.ObjectId;
  deptAdmin?: mongoose.Types.ObjectId;
  approvalEmailSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IOrganizationRegistration>(
  {
    orgName: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    type: { type: String, default: 'PWD' },
    state: { type: String, required: true },
    city: { type: String, required: true },
    address: String,
    contactEmail: { type: String, required: true, lowercase: true },
    contactPhone: String,
    headOfDepartment: String,
    website: String,

    adminName: { type: String, required: true },
    adminEmail: { type: String, required: true, lowercase: true },
    adminPhone: String,
    adminDesignation: String,

    requestedModules: { type: [String], default: ['etender', 'erp', 'finance', 'mb', 'reports'] },
    expectedUsers: Number,
    expectedProjects: Number,
    preferredPlan: { type: String, default: 'TRIAL' },
    notes: String,

    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFO'],
      default: 'PENDING',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    rejectionReason: String,

    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    deptAdmin: { type: Schema.Types.ObjectId, ref: 'User' },
    approvalEmailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ status: 1, createdAt: -1 });
schema.index({ adminEmail: 1 });

const OrganizationRegistration = mongoose.model<IOrganizationRegistration>(
  'OrganizationRegistration',
  schema
);
export default OrganizationRegistration;
