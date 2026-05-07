import mongoose, { Schema, Document } from 'mongoose';

export type BidStatus =
  | 'DRAFT'
  | 'TECHNICAL_SUBMITTED'
  | 'FINANCIAL_SUBMITTED'
  | 'TECHNICALLY_QUALIFIED'
  | 'TECHNICALLY_DISQUALIFIED'
  | 'EVALUATED'
  | 'AWARDED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface IBid extends Document {
  _id: mongoose.Types.ObjectId;
  tender: mongoose.Types.ObjectId;
  contractor: mongoose.Types.ObjectId;
  contractorName?: string;
  // Technical bid
  technicalDocuments: { name: string; url: string; publicId?: string }[];
  technicalScore?: number;
  technicallyQualified?: boolean;
  technicalRemarks?: string;
  // Financial bid
  quotedAmount?: number;
  rateAnalysis?: { itemNo: number; rate: number; amount: number }[];
  // Evaluation
  status: BidStatus;
  rank?: number; // L1 = 1, L2 = 2 ...
  isL1: boolean;
  evaluatedBy?: mongoose.Types.ObjectId;
  evaluatedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bidSchema = new Schema<IBid>(
  {
    tender: { type: Schema.Types.ObjectId, ref: 'Tender', required: true, index: true },
    contractor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contractorName: String,
    technicalDocuments: [
      {
        name: String,
        url: String,
        publicId: String,
      },
    ],
    technicalScore: Number,
    technicallyQualified: Boolean,
    technicalRemarks: String,
    quotedAmount: { type: Number, min: 0 },
    rateAnalysis: [{ itemNo: Number, rate: Number, amount: Number }],
    status: {
      type: String,
      enum: [
        'DRAFT', 'TECHNICAL_SUBMITTED', 'FINANCIAL_SUBMITTED',
        'TECHNICALLY_QUALIFIED', 'TECHNICALLY_DISQUALIFIED',
        'EVALUATED', 'AWARDED', 'REJECTED', 'WITHDRAWN',
      ],
      default: 'DRAFT',
    },
    rank: Number,
    isL1: { type: Boolean, default: false },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    evaluatedAt: Date,
    submittedAt: Date,
  },
  { timestamps: true }
);

bidSchema.index({ tender: 1, contractor: 1 }, { unique: true });

const Bid = mongoose.model<IBid>('Bid', bidSchema);
export default Bid;
