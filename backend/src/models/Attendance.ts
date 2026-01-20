import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';
  markedBy?: mongoose.Types.ObjectId;
  markedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceModel extends Model<IAttendance> {
  findByEvent(eventId: mongoose.Types.ObjectId): Promise<IAttendance[]>;
  findByMember(memberId: mongoose.Types.ObjectId): Promise<IAttendance[]>;
  getAttendanceRate(memberId: mongoose.Types.ObjectId): Promise<number>;
}

const attendanceSchema = new Schema<IAttendance, IAttendanceModel>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    status: { type: String, enum: ['PRESENT', 'ABSENT', 'EXCUSED', 'LATE'], default: 'ABSENT' },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    markedAt: { type: Date },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

attendanceSchema.index({ eventId: 1, memberId: 1 }, { unique: true });
attendanceSchema.index({ memberId: 1 });
attendanceSchema.index({ eventId: 1, status: 1 });

attendanceSchema.statics.findByEvent = async function (eventId: mongoose.Types.ObjectId): Promise<IAttendance[]> {
  return this.find({ eventId }).populate('memberId', 'fullName').populate('markedBy', 'fullName').sort({ createdAt: 1 });
};

attendanceSchema.statics.findByMember = async function (memberId: mongoose.Types.ObjectId): Promise<IAttendance[]> {
  return this.find({ memberId }).populate('eventId', 'title type startTime').sort({ createdAt: -1 });
};

attendanceSchema.statics.getAttendanceRate = async function (memberId: mongoose.Types.ObjectId): Promise<number> {
  const total = await this.countDocuments({ memberId });
  if (total === 0) return 0;
  const present = await this.countDocuments({ memberId, status: { $in: ['PRESENT', 'LATE'] } });
  return Math.round((present / total) * 100);
};

const Attendance = mongoose.model<IAttendance, IAttendanceModel>('Attendance', attendanceSchema);
export default Attendance;
