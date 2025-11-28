import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedicalCheck extends Document {
  _id: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  issueDate: Date;
  validUntil: Date;
  documentUrl?: string;
  status: 'VALID' | 'EXPIRED' | 'PENDING';
  doctorName?: string;
  notes?: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedicalCheckModel extends Model<IMedicalCheck> {
  findByMember(memberId: mongoose.Types.ObjectId): Promise<IMedicalCheck[]>;
  getLatest(memberId: mongoose.Types.ObjectId): Promise<IMedicalCheck | null>;
  getExpiringSoon(days?: number): Promise<IMedicalCheck[]>;
}

const medicalCheckSchema = new Schema<IMedicalCheck, IMedicalCheckModel>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    issueDate: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    documentUrl: { type: String, trim: true },
    status: { type: String, enum: ['VALID', 'EXPIRED', 'PENDING'], default: 'PENDING' },
    doctorName: { type: String, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 500 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

medicalCheckSchema.index({ memberId: 1, validUntil: -1 });
medicalCheckSchema.index({ status: 1, validUntil: 1 });

medicalCheckSchema.statics.findByMember = async function (memberId: mongoose.Types.ObjectId): Promise<IMedicalCheck[]> {
  return this.find({ memberId }).sort({ validUntil: -1 });
};

medicalCheckSchema.statics.getLatest = async function (memberId: mongoose.Types.ObjectId): Promise<IMedicalCheck | null> {
  return this.findOne({ memberId }).sort({ validUntil: -1 });
};

medicalCheckSchema.statics.getExpiringSoon = async function (days: number = 30): Promise<IMedicalCheck[]> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);
  return this.find({ status: 'VALID', validUntil: { $gte: now, $lte: futureDate } }).populate('memberId', 'fullName');
};

const MedicalCheck = mongoose.model<IMedicalCheck, IMedicalCheckModel>('MedicalCheck', medicalCheckSchema);
export default MedicalCheck;
