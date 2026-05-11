import mongoose, { Schema, Document } from 'mongoose';

export type PaymentMode = 'RTGS' | 'NEFT' | 'CHEQUE' | 'DD' | 'IMPS';
export type PaymentStatus = 'INITIATED' | 'PROCESSING' | 'RELEASED' | 'FAILED';

export interface IPayment extends Document {
  paymentId: string;
  department: mongoose.Types.ObjectId;
  bill: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  contractor: mongoose.Types.ObjectId;
  amount: number;
  paymentMode: PaymentMode;
  utrNumber?: string;
  bankName?: string;
  accountNumber?: string; // last 4 only stored for safety
  ifsc?: string;
  paymentDate: Date;
  status: PaymentStatus;
  receiptUrl?: string;
  remarks?: string;
  releasedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, unique: true, required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    bill: { type: Schema.Types.ObjectId, ref: 'Bill', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    contractor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: {
      type: String,
      enum: ['RTGS', 'NEFT', 'CHEQUE', 'DD', 'IMPS'],
      default: 'RTGS',
    },
    utrNumber: String,
    bankName: String,
    accountNumber: String,
    ifsc: String,
    paymentDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['INITIATED', 'PROCESSING', 'RELEASED', 'FAILED'],
      default: 'INITIATED',
    },
    receiptUrl: String,
    remarks: String,
    releasedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;
