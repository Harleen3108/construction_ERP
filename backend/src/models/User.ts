import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole =
  | 'JE'           // Junior Engineer (creates proposals, MB entries)
  | 'SDO'          // Sub-Divisional Officer (1st level approver)
  | 'EE'           // Executive Engineer (2nd level approver)
  | 'CE'           // Chief Engineer (final approver)
  | 'TENDER_OFFICER'
  | 'CONTRACTOR'
  | 'ACCOUNTANT'
  | 'TREASURY'
  | 'ADMIN';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  designation?: string;
  department?: string; // e.g., "Haryana PWD"
  employeeId?: string;
  // Contractor specific
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;
  registrationNumber?: string;
  experienceYears?: number;
  active: boolean;
  avatar?: string;
  matchPassword(entered: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['JE', 'SDO', 'EE', 'CE', 'TENDER_OFFICER', 'CONTRACTOR', 'ACCOUNTANT', 'TREASURY', 'ADMIN'],
      required: true,
    },
    phone: String,
    designation: String,
    department: { type: String, default: 'PWD' },
    employeeId: String,
    companyName: String,
    gstNumber: String,
    panNumber: String,
    registrationNumber: String,
    experienceYears: Number,
    active: { type: Boolean, default: true },
    avatar: String,
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered: string) {
  return await bcrypt.compare(entered, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
