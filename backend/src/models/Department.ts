import mongoose, { Schema, Document } from 'mongoose';

export type DepartmentType = 'PWD' | 'IRRIGATION' | 'PUBLIC_HEALTH' | 'B&R' | 'RAILWAYS' | 'PRIVATE_COMPANY' | 'OTHER';
export type DepartmentStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';

export interface IDepartment extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;        // e.g., "HRY-PWD-2024"
  type: DepartmentType;
  state?: string;
  city?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  headOfDepartment?: string;
  logo?: string;
  // SaaS layer
  status: DepartmentStatus;
  enabledModules: string[]; // ['etender','erp','finance','reports','mb']
  createdBy?: mongoose.Types.ObjectId; // SuperAdmin who onboarded
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ['PWD', 'IRRIGATION', 'PUBLIC_HEALTH', 'B&R', 'RAILWAYS', 'PRIVATE_COMPANY', 'OTHER'],
      default: 'PWD',
    },
    state: String,
    city: String,
    address: String,
    contactEmail: String,
    contactPhone: String,
    headOfDepartment: String,
    logo: String,
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED'],
      default: 'TRIAL',
    },
    enabledModules: {
      type: [String],
      default: ['etender', 'erp', 'finance', 'mb', 'reports'],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

departmentSchema.index({ status: 1 });

const Department = mongoose.model<IDepartment>('Department', departmentSchema);
export default Department;
