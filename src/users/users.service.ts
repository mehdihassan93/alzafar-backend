import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { AddressDto } from './dto/address.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private emailService: EmailService,
  ) {}

  async create(userData: any): Promise<User> {
    const existingUser = await this.userModel.findOne({
      email: userData.email,
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const createdUser = new this.userModel({
      ...userData,
      password: hashedPassword,
    });
    const savedUser = await createdUser.save();

    try {
      await this.emailService.sendWelcomeEmail(
        savedUser.email,
        savedUser.firstName,
      );
    } catch (error) {
      console.error('Welcome email failed:', error);
    }

    return savedUser;
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

  async findAdmins(): Promise<User[]> {
    return this.userModel.find({ role: UserRole.ADMIN }).exec();
  }

  async createFromFirebase(data: {
    firebaseUid: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const existing = await this.userModel.findOne({
      $or: [{ email: data.email }, { firebaseUid: data.firebaseUid }],
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
    const savedUser = await createdUser.save();
    try {
      await this.emailService.sendWelcomeEmail(
        savedUser.email,
        savedUser.firstName,
      );
    } catch (error) {
      console.error('Welcome email failed:', error);
    }
    return savedUser;
  }

  async addAddress(firebaseUid: string, addressDto: AddressDto): Promise<User> {
    const user = await this.userModel.findOne({ firebaseUid });
    if (!user) throw new Error('User not found');

    // If this is the first address or marked as default, unset other defaults
    if (addressDto.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
      addressDto.isDefault = true;
    }

    user.addresses.push(addressDto as any);
    return user.save();
  }

  async removeAddress(firebaseUid: string, addressId: string): Promise<User> {
    const user = await this.userModel.findOne({ firebaseUid });
    if (!user) throw new Error('User not found');

    user.addresses = user.addresses.filter(
      (addr) => (addr as any)._id.toString() !== addressId,
    );

    // If we deleted the default address, make the first available one default
    if (
      user.addresses.length > 0 &&
      !user.addresses.some((addr) => addr.isDefault)
    ) {
      user.addresses[0].isDefault = true;
    }

    return user.save();
  }

  async updateAvatar(
    firebaseUid: string,
    avatar: { large: string; medium: string; thumbnail: string },
  ): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate({ firebaseUid }, { avatar }, { new: true })
      .exec();
    if (!user) throw new Error('User not found');
    return user;
  }
}
