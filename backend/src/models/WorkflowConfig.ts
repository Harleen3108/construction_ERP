import mongoose, { Schema, Document } from 'mongoose';

/**
 * Per-department configurable approval chains.
 * Allows Dept Admin to override the default JE → SDO → EE → CE workflow.
 */
export type WorkflowEntity = 'PROJECT' | 'TENDER' | 'MB' | 'BILL' | 'WORK_ORDER';

export interface IWorkflowStep {
  stage: string; // role name: JE, SDO, EE, CE, ACCOUNTANT, DEPT_ADMIN
  order: number;
  required: boolean;
  // Optional financial threshold — if entity amount > threshold, this step kicks in
  thresholdMin?: number;
  thresholdMax?: number;
  notes?: string;
}

export interface IWorkflowConfig extends Document {
  department: mongoose.Types.ObjectId;
  entityType: WorkflowEntity;
  steps: IWorkflowStep[];
  active: boolean;
  notifyOnEachStep: boolean;
  autoEscalateAfterDays?: number;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stepSchema = new Schema<IWorkflowStep>(
  {
    stage: { type: String, required: true },
    order: { type: Number, required: true },
    required: { type: Boolean, default: true },
    thresholdMin: Number,
    thresholdMax: Number,
    notes: String,
  },
  { _id: false }
);

const schema = new Schema<IWorkflowConfig>(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    entityType: { type: String, enum: ['PROJECT','TENDER','MB','BILL','WORK_ORDER'], required: true },
    steps: [stepSchema],
    active: { type: Boolean, default: true },
    notifyOnEachStep: { type: Boolean, default: true },
    autoEscalateAfterDays: Number,
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

schema.index({ department: 1, entityType: 1 }, { unique: true });

const WorkflowConfig = mongoose.model<IWorkflowConfig>('WorkflowConfig', schema);
export default WorkflowConfig;
