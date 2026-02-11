import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentModel extends Model<IComment> {
  findByPost(postId: mongoose.Types.ObjectId): Promise<IComment[]>;
  incrementLikes(commentId: mongoose.Types.ObjectId): Promise<IComment | null>;
  decrementLikes(commentId: mongoose.Types.ObjectId): Promise<IComment | null>;
}

const commentSchema = new Schema<IComment, ICommentModel>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    likesCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

commentSchema.index({ postId: 1, createdAt: -1 });

commentSchema.statics.findByPost = async function (postId: mongoose.Types.ObjectId): Promise<IComment[]> {
  return this.find({ postId }).sort({ createdAt: 1 }).populate('authorId', 'fullName profilePicture role');
};

commentSchema.statics.incrementLikes = async function (commentId: mongoose.Types.ObjectId): Promise<IComment | null> {
  return this.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } }, { new: true });
};

commentSchema.statics.decrementLikes = async function (commentId: mongoose.Types.ObjectId): Promise<IComment | null> {
  return this.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } }, { new: true });
};

const Comment = mongoose.model<IComment, ICommentModel>('Comment', commentSchema);
export default Comment;
