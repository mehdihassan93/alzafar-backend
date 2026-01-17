import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Wishlist extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  items: Types.ObjectId[];
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// Indexes
WishlistSchema.index({ user: 1, name: 1 }, { unique: true });
