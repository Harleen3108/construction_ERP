import mongoose, { Schema, Document } from 'mongoose';

export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_TRACK' | 'DELAYED' | 'COMPLETED';

export interface IMilestone extends Document {
  project: mongoose.Types.ObjectId;
  name: string; // Foundation, Structure, Roofing
  description?: string;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  progress: number; // 0-100 %
  status: MilestoneStatus;
  remarks?: string;
  photos: { url: string; publicId?: string; uploadedAt?: Date; caption?: string }[];
  manpower?: number;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true },
    description: String,
    plannedStartDate: { type: Date, required: true },
    plannedEndDate: { type: Date, required: true },
    actualStartDate: Date,
    actualEndDate: Date,
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'ON_TRACK', 'DELAYED', 'COMPLETED'],
      default: 'NOT_STARTED',
    },
    remarks: String,
    photos: [
      {
        url: String,
        publicId: String,
        uploadedAt: { type: Date, default: Date.now },
        caption: String,
      },
    ],
    manpower: Number,
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Milestone = mongoose.model<IMilestone>('Milestone', milestoneSchema);
export default Milestone;
