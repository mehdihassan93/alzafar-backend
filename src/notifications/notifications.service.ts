import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<Notification>
    ) { }

    async create(userId: string, title: string, message: string, type: string, metadata?: any) {
        return this.notificationModel.create({
            user: new Types.ObjectId(userId),
            title,
            message,
            type,
            metadata
        });
    }

    async findAll(userId: string) {
        return this.notificationModel.find({ user: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();
    }

    async markAsRead(userId: string, notificationId: string) {
        return this.notificationModel.findOneAndUpdate(
            { _id: notificationId, user: new Types.ObjectId(userId) },
            { isRead: true },
            { new: true }
        ).exec();
    }
}
