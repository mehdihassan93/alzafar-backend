import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop([
    {
      product: { type: Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ])
  items: {
    product: Types.ObjectId;
    quantity: number;
    price: number;
  }[];

  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ default: 0 })
  shippingCost: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: OrderStatus.PENDING, enum: OrderStatus })
  status: OrderStatus;

  @Prop({ default: PaymentStatus.PENDING, enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @Prop({ required: true })
  shippingAddress: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ default: false })
  isFlagged: boolean;

  @Prop({ default: 0 })
  fraudScore: number;

  @Prop({
    type: [
      {
        status: { type: String, enum: OrderStatus, required: true },
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: String, // Admin ID or System
      },
    ],
    default: [],
  })
  timeline: {
    status: OrderStatus;
    timestamp: Date;
    note?: string;
    updatedBy?: string;
  }[];

  @Prop()
  paymentMethod: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
