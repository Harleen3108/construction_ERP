import mongoose, { Schema, Document } from 'mongoose';

/**
 * A division/sub-unit within a department.
 * Example: "Karnal Division" under "Haryana PWD"
 */
export interface IDivision extends Document {
  department: mongoose.Types.ObjectId;
  name: string;
  code: string;
  city?: string;
  state?: string;
  inCharge?: mongoose.Types.ObjectId; // typically EE or SDO
  contactEmail?: string;
  contactPhone?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDivision>(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    city: String,
    state: String,
    inCharge: { type: Schema.Types.ObjectId, ref: 'User' },
    contactEmail: String,
    contactPhone: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

schema.index({ department: 1, code: 1 }, { unique: true });

const Division = mongoose.model<IDivision>('Division', schema);
export default Division;
