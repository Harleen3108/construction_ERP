import mongoose, { Schema, Document } from 'mongoose';

export type ProjectStatus =
  | 'PROPOSED'        // Stage 1
  | 'UNDER_APPROVAL'  // Stage 2
  | 'SANCTIONED'      // Stage 2 done, ready for tender
  | 'TENDER_CREATED'  // Stage 3
  | 'TENDER_PUBLISHED' // Stage 4
  | 'BIDDING_OPEN'    // Stage 5
  | 'BID_EVALUATION'  // Stage 6
  | 'AWARDED'         // Stage 7
  | 'IN_PROGRESS'     // Stage 8
  | 'COMPLETED'       // Stage 12
  | 'REJECTED'
  | 'ON_HOLD';

export interface IProjectDocument {
  name: string;
  url: string;
  publicId?: string;
  uploadedAt: Date;
}

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: string;
  name: string;
  description?: string;
  location: string;
  district?: string;
  state?: string;
  estimatedCost: number; // in INR
  finalCost?: number;
  projectType: string; // Building, Road, Drainage, etc.
  fundingSource: string; // State Government, Central Government, etc.
  department: string; // Haryana PWD, etc.
  category?: string;
  status: ProjectStatus;
  proposedBy: mongoose.Types.ObjectId; // JE
  documents: IProjectDocument[];
  drawings: IProjectDocument[];
  boqFile?: IProjectDocument;
  // Approval refs (Stage 2)
  approvals: mongoose.Types.ObjectId[]; // ref Approval
  // Tender ref (Stage 3-7)
  tender?: mongoose.Types.ObjectId;
  // Award (Stage 7)
  awardedTo?: mongoose.Types.ObjectId; // contractor user id
  awardedAmount?: number;
  workOrder?: mongoose.Types.ObjectId;
  // Execution dates (Stage 8)
  startDate?: Date;
  endDate?: Date;
  actualEndDate?: Date;
  overallProgress: number; // 0-100 %
  // Timeline
  proposedAt: Date;
  sanctionedAt?: Date;
  awardedAt?: Date;
  completedAt?: Date;
  closureReport?: string;
  createdAt: Date;
  updatedAt: Date;
}

const docSchema = new Schema<IProjectDocument>(
  {
    name: String,
    url: String,
    publicId: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    projectId: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: [true, 'Project name is required'], trim: true },
    description: String,
    location: { type: String, required: true },
    district: String,
    state: { type: String, default: 'Haryana' },
    estimatedCost: { type: Number, required: true, min: 0 },
    finalCost: Number,
    projectType: {
      type: String,
      required: true,
      enum: ['Building Construction', 'Road Construction', 'Drainage', 'Bridge', 'Water Supply', 'Renovation', 'Other'],
    },
    fundingSource: {
      type: String,
      required: true,
      enum: ['State Government', 'Central Government', 'World Bank', 'CSR', 'Other'],
    },
    department: { type: String, default: 'PWD' },
    category: String,
    status: {
      type: String,
      enum: [
        'PROPOSED', 'UNDER_APPROVAL', 'SANCTIONED', 'TENDER_CREATED',
        'TENDER_PUBLISHED', 'BIDDING_OPEN', 'BID_EVALUATION',
        'AWARDED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'ON_HOLD',
      ],
      default: 'PROPOSED',
    },
    proposedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    documents: [docSchema],
    drawings: [docSchema],
    boqFile: docSchema,
    approvals: [{ type: Schema.Types.ObjectId, ref: 'Approval' }],
    tender: { type: Schema.Types.ObjectId, ref: 'Tender' },
    awardedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    awardedAmount: Number,
    workOrder: { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
    startDate: Date,
    endDate: Date,
    actualEndDate: Date,
    overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    proposedAt: { type: Date, default: Date.now },
    sanctionedAt: Date,
    awardedAt: Date,
    completedAt: Date,
    closureReport: String,
  },
  { timestamps: true }
);

projectSchema.index({ status: 1, department: 1 });
projectSchema.index({ proposedBy: 1 });
projectSchema.index({ awardedTo: 1 });

const Project = mongoose.model<IProject>('Project', projectSchema);
export default Project;
