import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Embedded sub-document — no _id
@Schema({ _id: false })
export class PaymentLogEntry {
  @Prop({ required: true })
  action: string; // 'PAYMENT_RECORDED' | 'PAYMENT_UPDATED'

  @Prop({ required: true })
  amount: number;

  @Prop()
  prev_amount: number;

  @Prop({ required: true })
  by_user_id: string;

  @Prop({ required: true })
  by_email: string;

  @Prop({ required: true })
  at: Date;

  @Prop({ default: '' })
  note: string;
}

export const PaymentLogEntrySchema =
  SchemaFactory.createForClass(PaymentLogEntry);

export type RentRecordDocument = RentRecord & Document;

@Schema({
  collection: 'rent_records',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RentRecord {
  @Prop({ type: Types.ObjectId, required: true })
  room_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  tenant_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  property_id: Types.ObjectId;

  @Prop({ required: true })
  month: number;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  base_rent: number;

  @Prop({ default: 0 })
  electricity: number;

  @Prop({ default: 0 })
  carry_forward: number;

  @Prop({ required: true })
  total: number;

  @Prop({ default: 0 })
  paid_amount: number;

  @Prop({
    enum: ['PAID', 'PARTIAL', 'PENDING'],
    default: 'PENDING',
  })
  status: string;

  @Prop({ default: null })
  paid_date: Date;

  @Prop({ default: '' })
  notes: string;

  @Prop({ type: [PaymentLogEntrySchema], default: [] })
  payment_history: PaymentLogEntry[];
}

export const RentRecordSchema = SchemaFactory.createForClass(RentRecord);

// Unique compound index — prevents duplicate records for same room/month/year
RentRecordSchema.index({ room_id: 1, month: 1, year: 1 }, { unique: true });
RentRecordSchema.index({ property_id: 1, month: 1, year: 1 });
RentRecordSchema.index({ tenant_id: 1 });
