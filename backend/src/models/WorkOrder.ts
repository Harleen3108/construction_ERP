import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkOrder extends Document {
  workOrderId: string;
  loaId: string;
  department: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  tender: mongoose.Types.ObjectId;
  contractor: mongoose.Types.ObjectId;
  contractorName?: string;
  awardedAmount: number;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  agreementUrl?: string;
  loaUrl?: string;
  workOrderUrl?: string;
  issuedBy: mongoose.Types.ObjectId;
  issuedAt: Date;
  acceptedByContractor: boolean;
  acceptedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workOrderSchema = new Schema<IWorkOrder>(
  {
    workOrderId: { type: String, unique: true, required: true, index: true },
    loaId: { type: String, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    tender: { type: Schema.Types.ObjectId, ref: 'Tender', required: true },
    contractor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contractorName: String,
    awardedAmount: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    durationDays: Number,
    agreementUrl: String,
    loaUrl: String,
    workOrderUrl: String,
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issuedAt: { type: Date, default: Date.now },
    acceptedByContractor: { type: Boolean, default: false },
    acceptedAt: Date,
    remarks: String,
  },
  { timestamps: true }
);

const WorkOrder = mongoose.model<IWorkOrder>('WorkOrder', workOrderSchema);
export default WorkOrder;
