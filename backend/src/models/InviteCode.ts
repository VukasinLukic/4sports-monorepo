import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * InviteCode Interface
 * @description Defines the structure of an InviteCode document
 */
export interface IInviteCode extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  clubId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  type: 'COACH' | 'MEMBER';
  expiresAt: Date;
  usedCount: number;
  maxUses: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isValid(): boolean;
  incrementUsage(): Promise<void>;
}

/**
 * InviteCode Model Interface
 * @description Extends Mongoose Model with static methods
 */
export interface IInviteCodeModel extends Model<IInviteCode> {
  generateCode(
    clubId: mongoose.Types.ObjectId,
    createdBy: mongoose.Types.ObjectId,
    type: 'COACH' | 'MEMBER',
    maxUses?: number,
    expiresInDays?: number
  ): Promise<IInviteCode>;
}

/**
 * InviteCode Schema
 * @description Mongoose schema for InviteCode collection
 */
const inviteCodeSchema = new Schema<IInviteCode, IInviteCodeModel>(
  {
    code: {
      type: String,
      required: [true, 'Invite code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [8, 'Invite code must be at least 8 characters'],
      maxlength: [12, 'Invite code cannot exceed 12 characters'],
    },

    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: [true, 'Club ID is required'],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
    },

    type: {
      type: String,
      enum: {
        values: ['COACH', 'MEMBER'],
        message: 'Type must be COACH or MEMBER',
      },
      required: [true, 'Invite type is required'],
    },

    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },

    usedCount: {
      type: Number,
      required: [true, 'Used count is required'],
      min: [0, 'Used count cannot be negative'],
      default: 0,
    },

    maxUses: {
      type: Number,
      required: [true, 'Max uses is required'],
      min: [1, 'Max uses must be at least 1'],
      default: 1,
    },

    isActive: {
      type: Boolean,
      required: [true, 'Active status is required'],
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ========================================
// INDEXES
// ========================================

// CRITICAL: Enforce uniqueness
// NOTE: code unique index already defined via schema field properties

// PERFORMANCE: Fast lookups
inviteCodeSchema.index({ clubId: 1, isActive: 1 });
inviteCodeSchema.index({ code: 1, isActive: 1 });
inviteCodeSchema.index({ expiresAt: 1 });

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Check if invite code is valid
 * @description Validates if code can be used (active, not expired, under usage limit)
 */
inviteCodeSchema.methods.isValid = function (): boolean {
  const now = new Date();
  return (
    this.isActive &&
    this.expiresAt > now &&
    this.usedCount < this.maxUses
  );
};

/**
 * Increment usage count
 * @description Increments usedCount and deactivates if maxUses reached
 */
inviteCodeSchema.methods.incrementUsage = async function (): Promise<void> {
  this.usedCount += 1;

  // Auto-deactivate if max uses reached
  if (this.usedCount >= this.maxUses) {
    this.isActive = false;
  }

  await this.save();
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Generate new invite code
 * @description Creates a new invite code with auto-generated unique code
 */
inviteCodeSchema.statics.generateCode = async function (
  clubId: mongoose.Types.ObjectId,
  createdBy: mongoose.Types.ObjectId,
  type: 'COACH' | 'MEMBER',
  maxUses: number = 1,
  expiresInDays: number = 7
): Promise<IInviteCode> {
  // Generate unique code (8 characters, alphanumeric)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Create invite code
  const inviteCode = await this.create({
    code,
    clubId,
    createdBy,
    type,
    maxUses,
    expiresAt,
  });

  return inviteCode;
};

// ========================================
// MODEL EXPORT
// ========================================

const InviteCode = mongoose.model<IInviteCode, IInviteCodeModel>(
  'InviteCode',
  inviteCodeSchema
);

export default InviteCode;
