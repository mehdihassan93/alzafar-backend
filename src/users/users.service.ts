import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) { }

    async create(userData: any): Promise<User> {
        const existingUser = await this.userModel.findOne({ email: userData.email });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const createdUser = new this.userModel({
            ...userData,
            password: hashedPassword,
        });
        return createdUser.save();
    }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
        return this.userModel.findOne({ firebaseUid }).exec();
    }

    async findById(id: string): Promise<User | null> {
        return this.userModel.findById(id).exec();
    }

    async createFromFirebase(data: { firebaseUid: string, email: string, firstName: string, lastName: string }): Promise<User> {
        const existing = await this.userModel.findOne({
            $or: [{ email: data.email }, { firebaseUid: data.firebaseUid }]
        });

        if (existing) {
            if (!existing.firebaseUid) {
                existing.firebaseUid = data.firebaseUid;
                return existing.save();
            }
            return existing;
        }

        const createdUser = new this.userModel({
            ...data,
            role: UserRole.USER,
            isActive: true,
        });
        return createdUser.save();
    }
}
