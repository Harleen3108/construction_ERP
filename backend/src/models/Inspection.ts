import mongoose, { Schema, Document } from 'mongoose';

export type InspectionType = 'ROUTINE' | 'QUALITY' | 'SURPRISE' | 'PRE_BILL' | 'COMPLETION';
export type InspectionStatus = 'SCHEDULED' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';

export interface IInspection extends Document {
  department: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  type: InspectionType;
  scheduledDate: Date;
  conductedDate?: Date;
  inspector: mongoose.Types.ObjectId;
  status: InspectionStatus;
  findings?: string;
  rating?: number; // 1-5
  recommendations?: string;
  photos: { url: string; publicId?: string }[];
  followUpRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IInspection>(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    type: {
      type: String,
      enum: ['ROUTINE', 'QUALITY', 'SURPRISE', 'PRE_BILL', 'COMPLETION'],
      default: 'ROUTINE',
    },
    scheduledDate: { type: Date, required: true },
    conductedDate: Date,
    inspector: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'POSTPONED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
    findings: String,
    rating: { type: Number, min: 1, max: 5 },
    recommendations: String,
    photos: [{ url: String, publicId: String }],
    followUpRequired: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Inspection = mongoose.model<IInspection>('Inspection', schema);
export default Inspection;
