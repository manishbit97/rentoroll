import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomDocument = Room & Document;

@Schema({
  collection: 'rooms',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Room {
  @Prop({ type: Types.ObjectId, required: true })
  property_id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  base_rent: number;

  @Prop({ default: null })
  base_rent_effective_from: Date | null;

  // is_occupied is NOT stored — computed at query time from tenant_assignments
}

export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.index({ property_id: 1 });
