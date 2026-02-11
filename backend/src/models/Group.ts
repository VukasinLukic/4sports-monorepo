import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Group Interface
 * @description Defines the structure of a Group document
 */
export interface IGroup extends Document {
  _id: mongoose.Types.ObjectId;
  clubId: mongoose.Types.ObjectId;
  name: string;
  color?: string;
  coaches: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Group Model Interface
 * @description Extends Mongoose Model with static methods
 */
export interface IGroupModel extends Model<IGroup> {
  findByClub(clubId: mongoose.Types.ObjectId): Promise<IGroup[]>;
  findByCoach(coachId: mongoose.Types.ObjectId): Promise<IGroup[]>;
}

/**
 * Group Schema
 * @description Mongoose schema for Group collection
 */
const groupSchema = new Schema<IGroup, IGroupModel>(
  {
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: [true, 'Club ID is required'],
    },

    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [2, 'Group name must be at least 2 characters'],
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },

    color: {
      type: String,
      trim: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color (e.g., #FF5733)'],
    },

    coaches: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
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
groupSchema.index({ clubId: 1, isActive: 1 });
groupSchema.index({ coaches: 1 });
groupSchema.index({ clubId: 1, name: 1 });

// ========================================
// VIRTUALS
// ========================================

/**
 * Virtual populate for members
 * @description Populates members that belong to this group
 */
groupSchema.virtual('members', {
  ref: 'Member',
  localField: '_id',
  foreignField: 'clubs.groupId',
});

// ========================================
// MIDDLEWARE (HOOKS)
// ========================================

/**
 * Post-delete hook
 * @description Clean up related data when group is deleted
 */
groupSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    // Remove this group from all members
    const Member = mongoose.model('Member');
    await Member.updateMany(
      { 'clubs.groupId': doc._id },
      { $pull: { clubs: { groupId: doc._id } } }
    );

    console.log(`✅ Cascade delete: Removed group ${doc._id} from all members`);
  }
});

// ========================================
// STATIC METHODS
// ========================================

/**
 * Find groups by club
 * @description Returns all groups for a specific club
 */
groupSchema.statics.findByClub = async function (
  clubId: mongoose.Types.ObjectId
): Promise<IGroup[]> {
  return this.find({ clubId, isActive: true })
    .populate('coaches', 'fullName email')
    .sort({ name: 1 });
};

/**
 * Find groups by coach
 * @description Returns all groups assigned to a specific coach
 */
groupSchema.statics.findByCoach = async function (
  coachId: mongoose.Types.ObjectId
): Promise<IGroup[]> {
  return this.find({ coaches: coachId, isActive: true })
    .populate('clubId', 'name')
    .sort({ name: 1 });
};

// ========================================
// MODEL EXPORT
// ========================================

const Group = mongoose.model<IGroup, IGroupModel>('Group', groupSchema);

export default Group;
