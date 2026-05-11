import mongoose, { Schema, Document } from 'mongoose';

export type PlanTier = 'TRIAL' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface ISubscription extends Document {
  department: mongoose.Types.ObjectId;
  plan: PlanTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  amount: number;          // INR
  startDate: Date;
  endDate: Date;
  modules: string[];       // modules included in this plan
  maxUsers?: number;
  maxProjects?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subSchema = new Schema<ISubscription>(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    plan: {
      type: String,
      enum: ['TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'],
      default: 'TRIAL',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'],
      default: 'ACTIVE',
    },
    billingCycle: { type: String, enum: ['MONTHLY', 'YEARLY'], default: 'YEARLY' },
    amount: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day trial
    },
    modules: { type: [String], default: ['etender', 'erp', 'finance', 'mb', 'reports'] },
    maxUsers: Number,
    maxProjects: Number,
    notes: String,
  },
  { timestamps: true }
);

const Subscription = mongoose.model<ISubscription>('Subscription', subSchema);
export default Subscription;
