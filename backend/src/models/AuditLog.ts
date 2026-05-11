import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  department?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  userName?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  timestamp: Date;
  createdAt: Date;
}

const auditSchema = new Schema<IAuditLog>(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userRole: String,
    action: { type: String, required: true },
    entity: String,
    entityId: String,
    ipAddress: String,
    userAgent: String,
    metadata: Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditSchema.index({ entity: 1, entityId: 1 });

const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditSchema);
export default AuditLog;
