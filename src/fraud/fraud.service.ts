import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FraudLog, FraudReason } from './schemas/fraud-log.schema';
import { Order } from '../orders/schemas/order.schema';

@Injectable()
export class FraudService {
    private readonly logger = new Logger(FraudService.name);

    constructor(
        @InjectModel(FraudLog.name) private fraudLogModel: Model<FraudLog>,
        @InjectModel(Order.name) private orderModel: Model<Order>,
    ) { }

    async checkOrder(userId: string, orderData: any): Promise<{ isFlagged: boolean; score: number; reasons: FraudReason[] }> {
        let score = 0;
        const reasons: FraudReason[] = [];

        // 1. High Value Check (> $1000)
        if (orderData.totalAmount > 1000) {
            score += 40;
            reasons.push(FraudReason.HIGH_VALUE);
        }

        // 2. Velocity Check (Max 3 orders in 15 mins)
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentOrdersCount = await this.orderModel.countDocuments({
            user: new Types.ObjectId(userId),
            createdAt: { $gte: fifteenMinsAgo }
        }).exec();

        if (recentOrdersCount >= 3) {
            score += 60;
            reasons.push(FraudReason.VELOCITY_LIMIT);
        }

        // 3. Logic for "Flagging"
        const isFlagged = score >= 50;

        if (isFlagged) {
            this.logger.warn(`Fraud Alert: User ${userId} flagged for ${reasons.join(', ')}. Score: ${score}`);
            // We'll log it to database for admins
            await new this.fraudLogModel({
                user: new Types.ObjectId(userId),
                reason: reasons[0], // Primary reason
                score,
                metadata: { allReasons: reasons, orderData }
            }).save();
        }

        return { isFlagged, score, reasons };
    }

    async getFlaggedLogs() {
        return this.fraudLogModel.find().populate('user', 'firstName lastName email').exec();
    }
}
