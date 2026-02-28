import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Subscription Plan Limits
 * @description Defines member limits and pricing for each subscription tier
 */
export const SUBSCRIPTION_LIMITS = {
  FREE: { memberLimit: 50, price: 0 },
  BASIC: { memberLimit: 100, price: 1500 }, // RSD per month
  PRO: { memberLimit: 500, price: 5000 },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_LIMITS;

/**
 * Club Interface
 * @description Defines the structure of a Club document
 */
export interface IClub extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  ownerId?: mongoose.Types.ObjectId; // Optional initially, set after user creation
  address?: string;
  phoneNumber?: string;
  email?: string;
  subscriptionPlan: SubscriptionPlan;
  memberLimit: number;
  currentMembers: number;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  canAddMembers(count?: number): boolean;
  incrementMembers(count?: number): Promise<void>;
  decrementMembers(count?: number): Promise<void>;
}

/**
 * Club Model Interface
 * @description Extends Mongoose Model with static methods
 */
export interface IClubModel extends Model<IClub> {
  findByOwner(ownerId: mongoose.Types.ObjectId): Promise<IClub | null>;
}

/**
 * Club Schema
 * @description Mongoose schema for Club collection
 */
const clubSchema = new Schema<IClub, IClubModel>(
  {
    // Basic Info
    name: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
      minlength: [2, 'Club name must be at least 2 characters'],
      maxlength: [100, 'Club name cannot exceed 100 characters'],
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional initially, set after user creation
    },

    // Contact Info (Optional)
    address: {
      type: String,
      trim: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
      match: [
        /^\d{8,}$/,
        'Please provide a valid phone number with at least 8 digits',
      ],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    // Subscription & Limits
    subscriptionPlan: {
      type: String,
      required: [true, 'Subscription plan is required'],
      enum: {
        values: ['FREE', 'BASIC', 'PRO'],
        message: '{VALUE} is not a valid subscription plan',
      },
      default: 'FREE',
    },

    memberLimit: {
      type: Number,
      required: [true, 'Member limit is required'],
      min: [1, 'Member limit must be at least 1'],
      default: 50,
    },

    currentMembers: {
      type: Number,
      required: [true, 'Current members count is required'],
      min: [0, 'Current members cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ========================================
// INDEXES
// ========================================

// UNIQUE: One owner per club (sparse to allow null during creation)
clubSchema.index({ ownerId: 1 }, { unique: true, sparse: true });

// PERFORMANCE: Fast lookups
clubSchema.index({ subscriptionPlan: 1 });
clubSchema.index({ createdAt: -1 }); // Sort by newest

// ========================================
// MIDDLEWARE (HOOKS)
// ========================================

/**
 * Pre-save hook
 * @description Set memberLimit based on subscription plan
 */
clubSchema.pre('save', function () {
  if (this.isNew || this.isModified('subscriptionPlan')) {
    this.memberLimit =
      SUBSCRIPTION_LIMITS[this.subscriptionPlan].memberLimit;
  }
});

/**
 * Post-delete hook
 * @description Clean up related data when club is deleted (cascade delete)
 */
clubSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    // Import User model dynamically to avoid circular dependency
    const User = mongoose.model('User');

    // Delete all users in this club
    await User.deleteMany({ clubId: doc._id });

    // TODO: Phase 4+ - Delete all groups, members, events, etc.
    console.log(`✅ Cascade delete: Removed all users for club ${doc._id}`);
  }
});

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Check if club can add more members
 * @param count - Number of members to add (default: 1)
 * @returns true if adding count members doesn't exceed limit
 */
clubSchema.methods.canAddMembers = function (count: number = 1): boolean {
  return this.currentMembers + count <= this.memberLimit;
};

/**
 * Increment member count
 * @param count - Number of members to add (default: 1)
 * @throws Error if would exceed memberLimit
 */
clubSchema.methods.incrementMembers = async function (
  count: number = 1
): Promise<void> {
  if (!this.canAddMembers(count)) {
    throw new Error(
      `Cannot add ${count} members. Would exceed limit of ${this.memberLimit}`
    );
  }

  this.currentMembers += count;
  await this.save();
};

/**
 * Decrement member count
 * @param count - Number of members to remove (default: 1)
 * @throws Error if would result in negative count
 */
clubSchema.methods.decrementMembers = async function (
  count: number = 1
): Promise<void> {
  if (this.currentMembers - count < 0) {
    throw new Error('Cannot decrement below 0 members');
  }

  this.currentMembers -= count;
  await this.save();
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Find club by owner
 * @param ownerId - Owner's ObjectId
 * @returns Club document or null
 */
clubSchema.statics.findByOwner = function (
  ownerId: mongoose.Types.ObjectId
): Promise<IClub | null> {
  return this.findOne({ ownerId }).populate('ownerId', 'fullName email');
};

// ========================================
// MODEL EXPORT
// ========================================

const Club = mongoose.model<IClub, IClubModel>('Club', clubSchema);

export default Club;
