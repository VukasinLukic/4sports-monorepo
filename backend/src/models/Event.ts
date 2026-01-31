import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface IRecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  days?: number[]; // 0-6 for weekly (Sunday=0), 1-31 for monthly
  until?: Date;
}

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  clubId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  createdBy: mongoose.Types.ObjectId;
  isMandatory: boolean;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  // Advanced fields
  notes?: string;
  equipment?: string[];
  maxParticipants?: number;
  // QR Check-in
  qrCode: string;
  // Recurring events
  isRecurring: boolean;
  recurringPattern?: IRecurringPattern;
  parentEventId?: mongoose.Types.ObjectId; // For recurring instances
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventModel extends Model<IEvent> {
  findByGroup(groupId: mongoose.Types.ObjectId): Promise<IEvent[]>;
  findByClub(clubId: mongoose.Types.ObjectId): Promise<IEvent[]>;
  findUpcoming(groupId: mongoose.Types.ObjectId): Promise<IEvent[]>;
}

const eventSchema = new Schema<IEvent, IEventModel>(
  {
    clubId: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    type: { type: String, required: true, trim: true, maxlength: 50 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { type: String, trim: true, maxlength: 200 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isMandatory: { type: Boolean, default: true },
    status: { type: String, enum: ['SCHEDULED', 'CANCELLED', 'COMPLETED'], default: 'SCHEDULED' },
    // Advanced fields
    notes: { type: String, trim: true, maxlength: 2000 },
    equipment: [{ type: String, trim: true, maxlength: 100 }],
    maxParticipants: { type: Number, min: 1 },
    // QR Check-in - auto-generated unique code
    qrCode: { type: String, unique: true, default: () => crypto.randomUUID() },
    // Recurring events
    isRecurring: { type: Boolean, default: false },
    recurringPattern: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      days: [{ type: Number }],
      until: { type: Date },
    },
    parentEventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  },
  { timestamps: true }
);

eventSchema.index({ clubId: 1, startTime: -1 });
eventSchema.index({ groupId: 1, startTime: -1 });
eventSchema.index({ startTime: 1, status: 1 });
eventSchema.index({ qrCode: 1 });
eventSchema.index({ parentEventId: 1 });

eventSchema.statics.findByGroup = async function (groupId: mongoose.Types.ObjectId): Promise<IEvent[]> {
  return this.find({ groupId, status: { $ne: 'CANCELLED' } }).sort({ startTime: 1 }).populate('createdBy', 'fullName');
};

eventSchema.statics.findByClub = async function (clubId: mongoose.Types.ObjectId): Promise<IEvent[]> {
  return this.find({ clubId, status: { $ne: 'CANCELLED' } }).sort({ startTime: 1 }).populate('groupId', 'name');
};

eventSchema.statics.findUpcoming = async function (groupId: mongoose.Types.ObjectId): Promise<IEvent[]> {
  return this.find({ groupId, status: 'SCHEDULED', startTime: { $gte: new Date() } }).sort({ startTime: 1 }).limit(10);
};

const Event = mongoose.model<IEvent, IEventModel>('Event', eventSchema);
export default Event;
