import mongoose, { Schema, Document } from 'mongoose';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface IInvoice extends Document {
  invoiceNumber: string;
  department: mongoose.Types.ObjectId;
  subscription?: mongoose.Types.ObjectId;
  description: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: string;
  utrNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, unique: true, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    description: { type: String, required: true },
    subtotal: { type: Number, required: true },
    taxPercent: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: ['DRAFT','SENT','PAID','OVERDUE','CANCELLED'], default: 'SENT' },
    issueDate: { type: Date, default: Date.now },
    dueDate: Date,
    paidDate: Date,
    paymentMethod: String,
    utrNumber: String,
    notes: String,
  },
  { timestamps: true }
);

schema.pre('save', function (next) {
  this.taxAmount = (this.subtotal * this.taxPercent) / 100;
  this.total = this.subtotal + this.taxAmount;
  next();
});

const Invoice = mongoose.model<IInvoice>('Invoice', schema);
export default Invoice;
