import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ unique: true, sparse: true })
  firebaseUid?: string;

  @Prop({
    type: {
      large: String,
      medium: String,
      thumbnail: String,
    },
    default: null,
  })
  avatar?: {
    large: string;
    medium: string;
    thumbnail: string;
  };

  @Prop({ required: false })
  password?: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ default: UserRole.USER, enum: UserRole })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: [
      {
        label: String,
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
        phoneNumber: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  addresses: {
    label: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phoneNumber?: string;
    isDefault: boolean;
  }[];
}

export const UserSchema = SchemaFactory.createForClass(User);
