import mongoose, { Schema, Document } from 'mongoose';

export type MaterialReqStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELIVERED';

export interface IMaterialRequest extends Document {
  project: mongoose.Types.ObjectId;
  contractor: mongoose.Types.ObjectId;
  items: { name: string; quantity: number; unit: string; remarks?: string }[];
  status: MaterialReqStatus;
  requestedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const matReqSchema = new Schema<IMaterialRequest>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    contractor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        name: String,
        quantity: Number,
        unit: String,
        remarks: String,
      },
    ],
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'DELIVERED'],
      default: 'PENDING',
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    remarks: String,
  },
  { timestamps: true }
);

const MaterialRequest = mongoose.model<IMaterialRequest>('MaterialRequest', matReqSchema);
export default MaterialRequest;
