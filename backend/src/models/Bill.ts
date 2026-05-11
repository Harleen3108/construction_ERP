import mongoose, { Schema, Document } from 'mongoose';

export type BillStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'JE_VERIFIED'
  | 'SDO_APPROVED'
  | 'EE_APPROVED'
  | 'ACCOUNTS_VERIFIED'
  | 'TREASURY_PENDING'
  | 'PAID'
  | 'REJECTED';

export type BillType = 'RA_BILL' | 'FINAL_BILL';

export interface IBill extends Document {
  _id: mongoose.Types.ObjectId;
  billId: string;
  billNumber: string;
  billType: BillType;
  department: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  workOrder: mongoose.Types.ObjectId;
  contractor: mongoose.Types.ObjectId;
  measurementBooks: mongoose.Types.ObjectId[]; // bill is based on approved MBs
  // Amounts
  grossAmount: number;        // sum of MB amounts
  previousBillsTotal: number; // earlier RA bills paid
  currentBillAmount: number;  // grossAmount - previousBillsTotal
  // Auto-calculated deductions
  gstPercent: number;
  gstAmount: number;
  tdsPercent: number;
  tdsAmount: number;
  securityPercent: number;
  securityAmount: number;
  retentionPercent: number;
  retentionAmount: number;
  otherDeductions: number;
  totalDeductions: number;
  netPayable: number; // currentBillAmount - totalDeductions
  // Workflow
  status: BillStatus;
  submittedAt?: Date;
  approvals: mongoose.Types.ObjectId[];
  payment?: mongoose.Types.ObjectId;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const billSchema = new Schema<IBill>(
  {
    billId: { type: String, unique: true, required: true, index: true },
    billNumber: { type: String, required: true },
    billType: { type: String, enum: ['RA_BILL', 'FINAL_BILL'], default: 'RA_BILL' },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    workOrder: { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
    contractor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    measurementBooks: [{ type: Schema.Types.ObjectId, ref: 'MeasurementBook' }],
    grossAmount: { type: Number, required: true, min: 0 },
    previousBillsTotal: { type: Number, default: 0 },
    currentBillAmount: { type: Number, required: true },
    gstPercent: { type: Number, default: 18 },
    gstAmount: { type: Number, default: 0 },
    tdsPercent: { type: Number, default: 1 },
    tdsAmount: { type: Number, default: 0 },
    securityPercent: { type: Number, default: 5 },
    securityAmount: { type: Number, default: 0 },
    retentionPercent: { type: Number, default: 0 },
    retentionAmount: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netPayable: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        'DRAFT', 'SUBMITTED', 'JE_VERIFIED', 'SDO_APPROVED', 'EE_APPROVED',
        'ACCOUNTS_VERIFIED', 'TREASURY_PENDING', 'PAID', 'REJECTED',
      ],
      default: 'DRAFT',
    },
    submittedAt: Date,
    approvals: [{ type: Schema.Types.ObjectId, ref: 'Approval' }],
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    remarks: String,
  },
  { timestamps: true }
);

billSchema.pre('save', function (next) {
  // Auto-calculate deductions before save
  this.gstAmount = (this.currentBillAmount * this.gstPercent) / 100;
  this.tdsAmount = (this.currentBillAmount * this.tdsPercent) / 100;
  this.securityAmount = (this.currentBillAmount * this.securityPercent) / 100;
  this.retentionAmount = (this.currentBillAmount * this.retentionPercent) / 100;
  this.totalDeductions =
    this.gstAmount + this.tdsAmount + this.securityAmount +
    this.retentionAmount + this.otherDeductions;
  this.netPayable = this.currentBillAmount - this.totalDeductions;
  next();
});

const Bill = mongoose.model<IBill>('Bill', billSchema);
export default Bill;
