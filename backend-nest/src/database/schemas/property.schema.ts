import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyDocument = Property & Document;

@Schema({
  collection: 'properties',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Property {
  @Prop({ type: Types.ObjectId, required: true })
  landlord_id: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  co_landlord_ids: Types.ObjectId[];

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  address: string;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
PropertySchema.index({ landlord_id: 1 });
