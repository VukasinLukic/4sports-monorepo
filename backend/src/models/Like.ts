import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILike extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  targetType: 'POST' | 'COMMENT';
  targetId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ILikeModel extends Model<ILike> {
  hasUserLiked(userId: mongoose.Types.ObjectId, targetType: string, targetId: mongoose.Types.ObjectId): Promise<boolean>;
}

const likeSchema = new Schema<ILike, ILikeModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['POST', 'COMMENT'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

likeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1 });

likeSchema.statics.hasUserLiked = async function (
  userId: mongoose.Types.ObjectId,
  targetType: string,
  targetId: mongoose.Types.ObjectId
): Promise<boolean> {
  const like = await this.findOne({ userId, targetType, targetId });
  return !!like;
};

const Like = mongoose.model<ILike, ILikeModel>('Like', likeSchema);
export default Like;
