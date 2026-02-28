import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * User Interface
 * @description Defines the structure of a User document
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firebaseUid: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  profileImage?: string;
  role: 'OWNER' | 'COACH' | 'PARENT' | 'MEMBER';
  clubId: mongoose.Types.ObjectId;
  pushToken?: string;
  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  isActive: boolean;

  // Instance methods
  hasPermission(requiredRole: string): boolean;
}

/**
 * User Model Interface
 * @description Extends Mongoose Model with static methods
 */
export interface IUserModel extends Model<IUser> {
  findByClub(clubId: mongoose.Types.ObjectId, role?: string): Promise<IUser[]>;
}

/**
 * User Schema
 * @description Mongoose schema for User collection
 */
const userSchema = new Schema<IUser, IUserModel>(
  {
    // Firebase Integration
    firebaseUid: {
      type: String,
      required: [true, 'Firebase UID is required'],
      unique: true,
      trim: true,
    },

    // Basic Info
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },

    phoneNumber: {
      type: String,
      trim: true,
      match: [
        /^\d{8,}$/,
        'Please provide a valid phone number with at least 8 digits',
      ],
    },

    profileImage: {
      type: String,
      trim: true,
    },

    // Role & Permissions
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['OWNER', 'COACH', 'PARENT', 'MEMBER'],
        message: '{VALUE} is not a valid role',
      },
    },

    // Club Association
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: [true, 'Club ID is required'],
    },

    // Push Notifications
    pushToken: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========================================
// INDEXES
// ========================================

// NOTE: firebaseUid and email unique indexes are already defined via schema field properties

// PERFORMANCE: Fast lookups
userSchema.index({ clubId: 1, role: 1 });
userSchema.index({ role: 1 });

// ========================================
// MIDDLEWARE (HOOKS)
// ========================================

/**
 * Pre-save hook
 * @description Normalize email to lowercase before saving
 */
userSchema.pre('save', function () {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
});

// ========================================
// VIRTUALS
// ========================================

/**
 * Virtual: isActive
 * @description Check if user has an associated club
 */
userSchema.virtual('isActive').get(function () {
  return !!this.clubId;
});

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Check if user has permission
 * @param requiredRole - Minimum required role
 * @returns true if user has sufficient permission
 */
userSchema.methods.hasPermission = function (requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    OWNER: 3,
    COACH: 2,
    PARENT: 1,
    MEMBER: 1, // Same level as PARENT
  };

  return (
    roleHierarchy[this.role] >= (roleHierarchy[requiredRole] || 0)
  );
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Find users by club
 * @param clubId - Club ObjectId
 * @param role - Optional role filter
 * @returns Array of users
 */
userSchema.statics.findByClub = function (
  clubId: mongoose.Types.ObjectId,
  role?: string
): Promise<IUser[]> {
  const query: any = { clubId };
  if (role) {
    query.role = role;
  }
  return this.find(query).select('-__v');
};

// ========================================
// MODEL EXPORT
// ========================================

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;
