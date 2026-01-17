import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: ['PRICE_DROP', 'STOCK_UPDATE', 'ORDER_STATUS', 'SYSTEM'],
    default: 'SYSTEM',
  })
  type: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Object })
  metadata?: any;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
