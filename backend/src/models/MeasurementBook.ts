import mongoose, { Schema, Document } from 'mongoose';

export type MBStatus = 'DRAFT' | 'SUBMITTED' | 'SDO_APPROVED' | 'EE_APPROVED' | 'REJECTED';

export interface IMBEntry {
  itemNo?: number;
  description: string;
  location?: string;
  length?: number;
  width?: number;
  height?: number;
  quantity: number;
  unit: string; // Cubic Meter, Sq.M, etc.
  rate?: number;
  amount?: number;
  remarks?: string;
}

export interface IMeasurementBook extends Document {
  mbId: string;
  project: mongoose.Types.ObjectId;
  workOrder: mongoose.Types.ObjectId;
  contractor: mongoose.Types.ObjectId;
  entryDate: Date;
  workItem: string;     // e.g., "Excavation"
  location?: string;    // School Site - Block A
  entries: IMBEntry[];
  totalAmount: number;
  status: MBStatus;
  recordedBy: mongoose.Types.ObjectId;
  approvals: mongoose.Types.ObjectId[];
  approvedAt?: Date;
  remarks?: string;
  photos?: { url: string; publicId?: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const mbEntrySchema = new Schema<IMBEntry>(
  {
    itemNo: Number,
    description: { type: String, required: true },
    location: String,
    length: Number,
    width: Number,
    height: Number,
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    rate: Number,
    amount: Number,
    remarks: String,
  },
  { _id: false }
);

const mbSchema = new Schema<IMeasurementBook>(
  {
    mbId: { type: String, unique: true, required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    workOrder: { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
    contractor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    entryDate: { type: Date, default: Date.now },
    workItem: { type: String, required: true },
    location: String,
    entries: [mbEntrySchema],
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'SDO_APPROVED', 'EE_APPROVED', 'REJECTED'],
      default: 'DRAFT',
    },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvals: [{ type: Schema.Types.ObjectId, ref: 'Approval' }],
    approvedAt: Date,
    remarks: String,
    photos: [{ url: String, publicId: String }],
  },
  { timestamps: true }
);

const MeasurementBook = mongoose.model<IMeasurementBook>('MeasurementBook', mbSchema);
export default MeasurementBook;
