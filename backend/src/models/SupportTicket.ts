import mongoose, { Schema, Document } from 'mongoose';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ISupportTicket extends Document {
  ticketId: string;
  department?: mongoose.Types.ObjectId;
  raisedBy: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  category: 'BUG' | 'FEATURE_REQUEST' | 'BILLING' | 'TECHNICAL' | 'OTHER';
  priority: TicketPriority;
  status: TicketStatus;
  attachments: { url: string; name: string }[];
  responses: { by: mongoose.Types.ObjectId; message: string; at: Date }[];
  assignedTo?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ISupportTicket>(
  {
    ticketId: { type: String, unique: true, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['BUG','FEATURE_REQUEST','BILLING','TECHNICAL','OTHER'], default: 'TECHNICAL' },
    priority: { type: String, enum: ['LOW','MEDIUM','HIGH','CRITICAL'], default: 'MEDIUM' },
    status: { type: String, enum: ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'], default: 'OPEN' },
    attachments: [{ url: String, name: String }],
    responses: [{ by: { type: Schema.Types.ObjectId, ref: 'User' }, message: String, at: { type: Date, default: Date.now } }],
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
  },
  { timestamps: true }
);

const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', schema);
export default SupportTicket;
