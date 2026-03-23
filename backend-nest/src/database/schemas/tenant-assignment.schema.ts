import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TenantAssignmentDocument = TenantAssignment & Document;

@Schema({
  collection: 'tenant_assignments',
  timestamps: { createdAt: 'created_at', updatedAt: false },
})
export class TenantAssignment {
  @Prop({ type: Types.ObjectId, required: true })
  room_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  tenant_id: Types.ObjectId;

  @Prop({ default: () => new Date() })
  start_date: Date;

  @Prop({ default: null })
  end_date: Date;

  @Prop({ default: true })
  is_active: boolean;
}

export const TenantAssignmentSchema =
  SchemaFactory.createForClass(TenantAssignment);
TenantAssignmentSchema.index({ room_id: 1, is_active: 1 });
TenantAssignmentSchema.index({ tenant_id: 1 });
