import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  type: string;          // 'APPROVAL_PENDING' | 'BILL_APPROVED' | 'PAYMENT_RELEASED' | etc.
  title: string;
  message: string;
  link?: string;
  read: boolean;
  readAt?: Date;
  meta?: any;
  createdAt: Date;
}

const schema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    read: { type: Boolean, default: false },
    readAt: Date,
    meta: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

schema.index({ user: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>('Notification', schema);
export default Notification;
