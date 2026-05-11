import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyProgress extends Document {
  department: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  reportDate: Date;
  workDescription: string;
  workCompletedToday?: string;
  manpower: { skilled?: number; unskilled?: number; supervisors?: number };
  materialsUsed?: { name: string; quantity: number; unit: string }[];
  weather?: 'CLEAR' | 'RAIN' | 'CLOUDY' | 'EXTREME';
  temperatureC?: number;
  issues?: string;
  photos: { url: string; publicId?: string; caption?: string }[];
  recordedBy: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDailyProgress>(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    reportDate: { type: Date, default: Date.now, required: true },
    workDescription: { type: String, required: true },
    workCompletedToday: String,
    manpower: {
      skilled: Number,
      unskilled: Number,
      supervisors: Number,
    },
    materialsUsed: [{ name: String, quantity: Number, unit: String }],
    weather: { type: String, enum: ['CLEAR', 'RAIN', 'CLOUDY', 'EXTREME'] },
    temperatureC: Number,
    issues: String,
    photos: [{ url: String, publicId: String, caption: String }],
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
  },
  { timestamps: true }
);

schema.index({ project: 1, reportDate: -1 });

const DailyProgress = mongoose.model<IDailyProgress>('DailyProgress', schema);
export default DailyProgress;
