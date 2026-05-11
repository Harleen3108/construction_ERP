import mongoose, { Schema, Document } from 'mongoose';

export type TenderStatus =
  | 'DRAFT'
  | 'UNDER_APPROVAL'
  | 'PUBLISHED'
  | 'BIDDING_OPEN'
  | 'BIDDING_CLOSED'
  | 'EVALUATION'
  | 'AWARDED'
  | 'CANCELLED';

export interface IBOQItem {
  serialNo: number;
  description: string;
  unit: string;        // Cubic Meter, Sq.M, etc.
  quantity: number;
  rate?: number;
  amount?: number;
}

export interface ITender extends Document {
  _id: mongoose.Types.ObjectId;
  tenderId: string;
  department: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  estimatedCost: number;
  emd: number;          // Earnest Money Deposit
  tenderFee: number;
  status: TenderStatus;
  publishDate?: Date;
  bidSubmissionStartDate?: Date;
  bidSubmissionEndDate?: Date;
  bidOpeningDate?: Date;
  boq: IBOQItem[];
  documents: { name: string; url: string; publicId?: string }[];
  technicalSpecs?: string;
  eligibilityCriteria?: string;
  createdBy: mongoose.Types.ObjectId;
  approvals: mongoose.Types.ObjectId[];
  bids: mongoose.Types.ObjectId[];
  l1Bid?: mongoose.Types.ObjectId; // lowest bidder
  awardedTo?: mongoose.Types.ObjectId;
  awardedAmount?: number;
  awardedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const boqSchema = new Schema<IBOQItem>(
  {
    serialNo: Number,
    description: String,
    unit: String,
    quantity: Number,
    rate: Number,
    amount: Number,
  },
  { _id: false }
);

const tenderSchema = new Schema<ITender>(
  {
    tenderId: { type: String, unique: true, required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: String,
    estimatedCost: { type: Number, required: true, min: 0 },
    emd: { type: Number, required: true, min: 0 },
    tenderFee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'UNDER_APPROVAL', 'PUBLISHED', 'BIDDING_OPEN', 'BIDDING_CLOSED', 'EVALUATION', 'AWARDED', 'CANCELLED'],
      default: 'DRAFT',
    },
    publishDate: Date,
    bidSubmissionStartDate: Date,
    bidSubmissionEndDate: Date,
    bidOpeningDate: Date,
    boq: [boqSchema],
    documents: [
      {
        name: String,
        url: String,
        publicId: String,
      },
    ],
    technicalSpecs: String,
    eligibilityCriteria: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvals: [{ type: Schema.Types.ObjectId, ref: 'Approval' }],
    bids: [{ type: Schema.Types.ObjectId, ref: 'Bid' }],
    l1Bid: { type: Schema.Types.ObjectId, ref: 'Bid' },
    awardedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    awardedAmount: Number,
    awardedAt: Date,
  },
  { timestamps: true }
);

const Tender = mongoose.model<ITender>('Tender', tenderSchema);
export default Tender;
