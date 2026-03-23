import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  collection: 'users',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({ required: true, enum: ['landlord', 'tenant'] })
  role: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  upi_id: string;

  @Prop({ default: null })
  reset_otp: string | null;

  @Prop({ default: null })
  reset_otp_expires_at: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
