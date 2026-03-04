import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  clubId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  type: 'EVENT_REMINDER' | 'PAYMENT_DUE' | 'MEDICAL_EXPIRY' | 'NEW_POST' | 'NEW_COMMENT' | 'ATTENDANCE_MARKED' | 'INVITE_ACCEPTED' | 'GENERAL';
  title: string;
  message: string;
  data?: {
    eventId?: mongoose.Types.ObjectId;
    postId?: mongoose.Types.ObjectId;
    commentId?: mongoose.Types.ObjectId;
    paymentId?: mongoose.Types.ObjectId;
    medicalCheckId?: mongoose.Types.ObjectId;
    [key: string]: any;
  };
  isRead: boolean;
  readAt?: Date;
  deliveryMethods: ('IN_APP' | 'PUSH' | 'EMAIL')[];
  deliveryStatus: {
    inApp?: 'PENDING' | 'DELIVERED' | 'FAILED';
    push?: 'PENDING' | 'DELIVERED' | 'FAILED';
    email?: 'PENDING' | 'DELIVERED' | 'FAILED';
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationModel extends Model<INotification> {
  findByRecipient(recipientId: mongoose.Types.ObjectId, options?: { unreadOnly?: boolean; limit?: number }): Promise<INotification[]>;
  markAsRead(notificationId: mongoose.Types.ObjectId): Promise<INotification | null>;
  markAllAsRead(recipientId: mongoose.Types.ObjectId): Promise<{ modifiedCount: number }>;
  getUnreadCount(recipientId: mongoose.Types.ObjectId): Promise<number>;
  createNotification(data: {
    clubId: mongoose.Types.ObjectId;
    recipientId: mongoose.Types.ObjectId;
    senderId?: mongoose.Types.ObjectId;
    type: INotification['type'];
    title: string;
    message: string;
    data?: INotification['data'];
    deliveryMethods?: INotification['deliveryMethods'];
    priority?: INotification['priority'];
    expiresAt?: Date;
  }): Promise<INotification>;
}

const notificationSchema = new Schema<INotification, INotificationModel>(
  {
    clubId: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['EVENT_REMINDER', 'PAYMENT_DUE', 'MEDICAL_EXPIRY', 'NEW_POST', 'NEW_COMMENT', 'ATTENDANCE_MARKED', 'INVITE_ACCEPTED', 'GENERAL'],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    deliveryMethods: {
      type: [String],
      enum: ['IN_APP', 'PUSH', 'EMAIL'],
      default: ['IN_APP'],
    },
    deliveryStatus: {
      inApp: { type: String, enum: ['PENDING', 'DELIVERED', 'FAILED'] },
      push: { type: String, enum: ['PENDING', 'DELIVERED', 'FAILED'] },
      email: { type: String, enum: ['PENDING', 'DELIVERED', 'FAILED'] },
    },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for efficient queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ clubId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static Methods

notificationSchema.statics.findByRecipient = async function (
  recipientId: mongoose.Types.ObjectId,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<INotification[]> {
  const query: any = { recipientId };
  if (options?.unreadOnly) {
    query.isRead = false;
  }

  let queryBuilder = this.find(query)
    .populate('senderId', 'fullName profileImage')
    .sort({ createdAt: -1 });

  if (options?.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }

  return queryBuilder;
};

notificationSchema.statics.markAsRead = async function (
  notificationId: mongoose.Types.ObjectId
): Promise<INotification | null> {
  return this.findByIdAndUpdate(
    notificationId,
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

notificationSchema.statics.markAllAsRead = async function (
  recipientId: mongoose.Types.ObjectId
): Promise<{ modifiedCount: number }> {
  const result = await this.updateMany(
    { recipientId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return { modifiedCount: result.modifiedCount || 0 };
};

notificationSchema.statics.getUnreadCount = async function (
  recipientId: mongoose.Types.ObjectId
): Promise<number> {
  return this.countDocuments({ recipientId, isRead: false });
};

notificationSchema.statics.createNotification = async function (data: {
  clubId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  type: INotification['type'];
  title: string;
  message: string;
  data?: INotification['data'];
  deliveryMethods?: INotification['deliveryMethods'];
  priority?: INotification['priority'];
  expiresAt?: Date;
}): Promise<INotification> {
  const deliveryStatus: any = {};

  if (data.deliveryMethods?.includes('IN_APP')) {
    deliveryStatus.inApp = 'DELIVERED';
  }
  if (data.deliveryMethods?.includes('PUSH')) {
    deliveryStatus.push = 'PENDING';
  }
  if (data.deliveryMethods?.includes('EMAIL')) {
    deliveryStatus.email = 'PENDING';
  }

  return this.create({
    ...data,
    deliveryMethods: data.deliveryMethods || ['IN_APP'],
    priority: data.priority || 'MEDIUM',
    deliveryStatus,
  });
};

const Notification = mongoose.model<INotification, INotificationModel>('Notification', notificationSchema);
export default Notification;
