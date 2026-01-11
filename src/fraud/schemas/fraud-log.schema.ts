import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FraudReason {
    HIGH_VALUE = 'high_value_transaction',
    VELOCITY_LIMIT = 'too_many_recent_orders',
    SUSPICIOUS_ADDRESS = 'suspicious_address_pattern',
    MULTIPLE_ACCOUNTS = 'possible_multi_account_fraud',
}

@Schema({ timestamps: true })
export class FraudLog extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Order' })
    order: Types.ObjectId;

    @Prop({ required: true, enum: FraudReason })
    reason: FraudReason;

    @Prop({ required: true })
    score: number; // 0 to 100

    @Prop({ type: Object })
    metadata: any;

    @Prop({ default: false })
    isResolved: boolean;
}

export const FraudLogSchema = SchemaFactory.createForClass(FraudLog);
