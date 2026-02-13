import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Club Membership Interface
 * @description Represents a member's association with a specific club/group
 */
export interface IClubMembership {
  clubId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  joinedAt: Date;
  status: 'ACTIVE' | 'INACTIVE';
}

/**
 * Member Interface
 * @description Defines the structure of a Member document
 */
export interface IMember extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  parentId?: mongoose.Types.ObjectId; // For child members
  userId?: mongoose.Types.ObjectId;   // For self-registered members (MEMBER role)
  clubs: IClubMembership[];
  profileImage?: string;
  position?: string;
  jerseyNumber?: number;
  height?: number;
  weight?: number;
  medicalInfo?: {
    bloodType?: string;
    allergies?: string;
    medications?: string;
    conditions?: string;
    lastCheckDate?: Date;
    expiryDate?: Date;
  };
  bodyMetrics?: {
    height?: number; // in cm
    weight?: number; // in kg
    updatedAt?: Date;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  membershipFee?: number;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isInClub(clubId: mongoose.Types.ObjectId): boolean;
  isInGroup(groupId: mongoose.Types.ObjectId): boolean;
  addToClub(
    clubId: mongoose.Types.ObjectId,
    groupId: mongoose.Types.ObjectId
  ): Promise<void>;
  removeFromClub(clubId: mongoose.Types.ObjectId): Promise<void>;
  getActiveClubs(): IClubMembership[];
}

/**
 * Member Model Interface
 * @description Extends Mongoose Model with static methods
 */
export interface IMemberModel extends Model<IMember> {
  findByParent(parentId: mongoose.Types.ObjectId): Promise<IMember[]>;
  findByUser(userId: mongoose.Types.ObjectId): Promise<IMember | null>;
  findByClub(clubId: mongoose.Types.ObjectId): Promise<IMember[]>;
  findByGroup(groupId: mongoose.Types.ObjectId): Promise<IMember[]>;
}

/**
 * Member Schema
 * @description Mongoose schema for Member collection
 */
const memberSchema = new Schema<IMember, IMemberModel>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },

    dateOfBirth: {
      type: Date,
      required: false, // Optional for self-registered members
      validate: {
        validator: function (value: Date) {
          // Must be in the past (if provided)
          if (!value) return true;
          return value < new Date();
        },
        message: 'Date of birth must be in the past',
      },
    },

    gender: {
      type: String,
      enum: {
        values: ['MALE', 'FEMALE', 'OTHER'],
        message: 'Gender must be MALE, FEMALE, or OTHER',
      },
      required: false, // Optional for self-registered members
    },

    // For child members: parentId is the parent's User ID
    // For self-registered members: userId links to their own User account
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional - either parentId or userId should be set
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Set for self-registered members (MEMBER role)
    },

    clubs: {
      type: [
        {
          clubId: {
            type: Schema.Types.ObjectId,
            ref: 'Club',
            required: true,
          },
          groupId: {
            type: Schema.Types.ObjectId,
            ref: 'Group',
            required: true,
          },
          joinedAt: {
            type: Date,
            default: Date.now,
          },
          status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE'],
            default: 'ACTIVE',
          },
        },
      ],
      default: [],
      validate: {
        validator: function (clubs: IClubMembership[]) {
          // At least one club required
          return clubs.length > 0;
        },
        message: 'Member must be associated with at least one club',
      },
    },

    profileImage: {
      type: String,
      trim: true,
    },

    position: {
      type: String,
      trim: true,
    },

    jerseyNumber: {
      type: Number,
      min: [0, 'Jersey number must be positive'],
      max: [999, 'Jersey number cannot exceed 999'],
    },

    height: {
      type: Number,
      min: [50, 'Height must be at least 50cm'],
      max: [300, 'Height cannot exceed 300cm'],
    },

    weight: {
      type: Number,
      min: [10, 'Weight must be at least 10kg'],
      max: [500, 'Weight cannot exceed 500kg'],
    },

    medicalInfo: {
      bloodType: String,
      allergies: String,
      medications: String,
      conditions: String,
      lastCheckDate: Date,
      expiryDate: Date,
    },

    bodyMetrics: {
      height: {
        type: Number,
        min: [50, 'Height must be at least 50cm'],
        max: [300, 'Height cannot exceed 300cm'],
      },
      weight: {
        type: Number,
        min: [10, 'Weight must be at least 10kg'],
        max: [500, 'Weight cannot exceed 500kg'],
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },

    emergencyContact: {
      name: {
        type: String,
        trim: true,
      },
      relationship: {
        type: String,
        trim: true,
      },
      phoneNumber: {
        type: String,
        trim: true,
        match: [
          /^\+[0-9]{10,15}$/,
          'Please provide a valid phone number in format +381XXXXXXXXX',
        ],
      },
    },

    membershipFee: {
      type: Number,
      min: [0, 'Membership fee must be non-negative'],
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

// PERFORMANCE: Fast lookups
memberSchema.index({ parentId: 1 });
memberSchema.index({ userId: 1 }); // For self-registered members
memberSchema.index({ 'clubs.clubId': 1, 'clubs.status': 1 });
memberSchema.index({ 'clubs.groupId': 1, 'clubs.status': 1 });
memberSchema.index({ fullName: 1 });

// ========================================
// VIRTUALS
// ========================================

/**
 * Virtual property: age
 * @description Calculates member's current age
 */
memberSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
});

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Check if member is in a specific club
 * @description Checks if member has an ACTIVE membership in the club
 * @note Handles both populated and non-populated clubId
 */
memberSchema.methods.isInClub = function (
  clubId: mongoose.Types.ObjectId
): boolean {
  return this.clubs.some((club: IClubMembership) => {
    // Handle populated clubId (object with _id) or raw ObjectId
    const clubIdValue = club.clubId as any;
    const memberClubId = clubIdValue && typeof clubIdValue === 'object' && '_id' in clubIdValue
      ? clubIdValue._id.toString()
      : clubIdValue?.toString();
    return memberClubId === clubId.toString() && club.status === 'ACTIVE';
  });
};

/**
 * Check if member is in a specific group
 * @description Checks if member has an ACTIVE membership in the group
 */
memberSchema.methods.isInGroup = function (
  groupId: mongoose.Types.ObjectId
): boolean {
  return this.clubs.some(
    (club: IClubMembership) =>
      club.groupId.toString() === groupId.toString() && club.status === 'ACTIVE'
  );
};

/**
 * Add member to a club/group
 * @description Adds a new club membership or updates existing one
 */
memberSchema.methods.addToClub = async function (
  clubId: mongoose.Types.ObjectId,
  groupId: mongoose.Types.ObjectId
): Promise<void> {
  // Check if already in this club
  const existingIndex = this.clubs.findIndex(
    (club: IClubMembership) => club.clubId.toString() === clubId.toString()
  );

  if (existingIndex !== -1) {
    // Update existing membership
    this.clubs[existingIndex].groupId = groupId;
    this.clubs[existingIndex].status = 'ACTIVE';
    this.clubs[existingIndex].joinedAt = new Date();
  } else {
    // Add new membership
    this.clubs.push({
      clubId,
      groupId,
      joinedAt: new Date(),
      status: 'ACTIVE',
    });
  }

  await this.save();
};

/**
 * Remove member from a club
 * @description Sets membership status to INACTIVE
 */
memberSchema.methods.removeFromClub = async function (
  clubId: mongoose.Types.ObjectId
): Promise<void> {
  const membership = this.clubs.find(
    (club: IClubMembership) => club.clubId.toString() === clubId.toString()
  );

  if (membership) {
    membership.status = 'INACTIVE';
    await this.save();
  }
};

/**
 * Get active clubs
 * @description Returns only ACTIVE club memberships
 */
memberSchema.methods.getActiveClubs = function (): IClubMembership[] {
  return this.clubs.filter((club: IClubMembership) => club.status === 'ACTIVE');
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Find members by parent
 * @description Returns all members (children) of a specific parent
 */
memberSchema.statics.findByParent = async function (
  parentId: mongoose.Types.ObjectId
): Promise<IMember[]> {
  return this.find({ parentId })
    .populate('clubs.clubId', 'name')
    .populate('clubs.groupId', 'name ageGroup')
    .sort({ fullName: 1 });
};

/**
 * Find member by user ID
 * @description Returns member document for self-registered member
 */
memberSchema.statics.findByUser = async function (
  userId: mongoose.Types.ObjectId
): Promise<IMember | null> {
  return this.findOne({ userId })
    .populate('clubs.clubId', 'name')
    .populate('clubs.groupId', 'name ageGroup');
};

/**
 * Find members by club
 * @description Returns all ACTIVE members in a specific club
 */
memberSchema.statics.findByClub = async function (
  clubId: mongoose.Types.ObjectId
): Promise<IMember[]> {
  return this.find({
    'clubs.clubId': clubId,
    'clubs.status': 'ACTIVE',
  })
    .populate('parentId', 'fullName email phoneNumber')
    .populate('clubs.groupId', 'name ageGroup')
    .sort({ fullName: 1 });
};

/**
 * Find members by group
 * @description Returns all ACTIVE members in a specific group
 */
memberSchema.statics.findByGroup = async function (
  groupId: mongoose.Types.ObjectId
): Promise<IMember[]> {
  return this.find({
    'clubs.groupId': groupId,
    'clubs.status': 'ACTIVE',
  })
    .populate('parentId', 'fullName email phoneNumber')
    .sort({ fullName: 1 });
};

// ========================================
// MODEL EXPORT
// ========================================

const Member = mongoose.model<IMember, IMemberModel>('Member', memberSchema);

export default Member;
