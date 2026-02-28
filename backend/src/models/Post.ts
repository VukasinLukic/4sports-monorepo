import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  clubId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  images?: string[];
  visibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'PARENTS_ONLY' | 'COACHES_ONLY';
  isPinned: boolean;
  type?: string;
  tags?: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostModel extends Model<IPost> {
  findByClub(clubId: mongoose.Types.ObjectId, visibility?: string[]): Promise<IPost[]>;
  getPinnedPosts(clubId: mongoose.Types.ObjectId): Promise<IPost[]>;
  incrementLikes(postId: mongoose.Types.ObjectId): Promise<IPost | null>;
  decrementLikes(postId: mongoose.Types.ObjectId): Promise<IPost | null>;
  incrementComments(postId: mongoose.Types.ObjectId): Promise<IPost | null>;
  decrementComments(postId: mongoose.Types.ObjectId): Promise<IPost | null>;
}

const postSchema = new Schema<IPost, IPostModel>(
  {
    clubId: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    images: [{ type: String, trim: true }],
    visibility: {
      type: String,
      enum: ['PUBLIC', 'MEMBERS_ONLY', 'PARENTS_ONLY', 'COACHES_ONLY'],
      default: 'MEMBERS_ONLY',
    },
    isPinned: { type: Boolean, default: false },
    type: { type: String, enum: ['ANNOUNCEMENT', 'NEWS', 'EVENT', 'ACHIEVEMENT', 'OTHER'], default: 'NEWS' },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

postSchema.index({ clubId: 1, createdAt: -1 });
postSchema.index({ clubId: 1, isPinned: -1, createdAt: -1 });
postSchema.index({ clubId: 1, visibility: 1, createdAt: -1 });

postSchema.statics.findByClub = async function (
  clubId: mongoose.Types.ObjectId,
  visibility?: string[]
): Promise<IPost[]> {
  const query: any = { clubId };
  if (visibility && visibility.length > 0) {
    query.visibility = { $in: visibility };
  }
  return this.find(query)
    .sort({ isPinned: -1, createdAt: -1 })
    .populate('authorId', 'fullName profileImage role');
};

postSchema.statics.getPinnedPosts = async function (clubId: mongoose.Types.ObjectId): Promise<IPost[]> {
  return this.find({ clubId, isPinned: true })
    .sort({ createdAt: -1 })
    .populate('authorId', 'fullName profileImage role');
};

postSchema.statics.incrementLikes = async function (postId: mongoose.Types.ObjectId): Promise<IPost | null> {
  return this.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } }, { new: true });
};

postSchema.statics.decrementLikes = async function (postId: mongoose.Types.ObjectId): Promise<IPost | null> {
  return this.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } }, { new: true });
};

postSchema.statics.incrementComments = async function (postId: mongoose.Types.ObjectId): Promise<IPost | null> {
  return this.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }, { new: true });
};

postSchema.statics.decrementComments = async function (postId: mongoose.Types.ObjectId): Promise<IPost | null> {
  return this.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } }, { new: true });
};

const Post = mongoose.model<IPost, IPostModel>('Post', postSchema);
export default Post;
