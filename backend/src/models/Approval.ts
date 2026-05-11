import mongoose, { Schema, Document } from 'mongoose';

export type ApprovalStage = 'JE' | 'SDO' | 'EE' | 'CE' | 'ACCOUNTANT' | 'DEPT_ADMIN';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
export type ApprovalEntity = 'PROJECT' | 'TENDER' | 'BID' | 'MB' | 'BILL' | 'PAYMENT';

export interface IApproval extends Document {
  department?: mongoose.Types.ObjectId;
  entityType: ApprovalEntity;
  entityId: mongoose.Types.ObjectId;
  stage: ApprovalStage;
  order: number; // 1, 2, 3 ... in workflow
  status: ApprovalStatus;
  approver?: mongoose.Types.ObjectId;
  approverName?: string;
  approverRole?: string;
  remarks?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const approvalSchema = new Schema<IApproval>(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    entityType: {
      type: String,
      enum: ['PROJECT', 'TENDER', 'BID', 'MB', 'BILL', 'PAYMENT'],
      required: true,
      index: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    stage: {
      type: String,
      enum: ['JE', 'SDO', 'EE', 'CE', 'ACCOUNTANT', 'DEPT_ADMIN'],
      required: true,
    },
    order: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED'],
      default: 'PENDING',
    },
    approver: { type: Schema.Types.ObjectId, ref: 'User' },
    approverName: String,
    approverRole: String,
    remarks: String,
    approvedAt: Date,
    rejectedAt: Date,
  },
  { timestamps: true }
);

approvalSchema.index({ entityType: 1, entityId: 1, order: 1 });
approvalSchema.index({ stage: 1, status: 1 });

const Approval = mongoose.model<IApproval>('Approval', approvalSchema);
export default Approval;
