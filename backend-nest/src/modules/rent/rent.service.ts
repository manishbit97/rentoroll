import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RentRecord,
  RentRecordDocument,
} from '@database/schemas/rent-record.schema';
import { Room, RoomDocument } from '@database/schemas/room.schema';
import {
  TenantAssignment,
  TenantAssignmentDocument,
} from '@database/schemas/tenant-assignment.schema';
import { User, UserDocument } from '@database/schemas/user.schema';
import { SaveRecordDto } from './dto/save-record.dto';

@Injectable()
export class RentService {
  constructor(
    @InjectModel(RentRecord.name)
    private readonly rentModel: Model<RentRecordDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(TenantAssignment.name)
    private readonly assignmentModel: Model<TenantAssignmentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  // ────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────

  private nextMonthYear(month: number, year: number): [number, number] {
    return month === 12 ? [1, year + 1] : [month + 1, year];
  }

  private prevMonthYear(month: number, year: number): [number, number] {
    return month === 1 ? [12, year - 1] : [month - 1, year];
  }

  private async computeCarryForward(
    roomId: Types.ObjectId,
    month: number,
    year: number,
  ): Promise<number> {
    const [prevM, prevY] = this.prevMonthYear(month, year);
    const prev = await this.rentModel.findOne({
      room_id: roomId,
      month: prevM,
      year: prevY,
    });
    if (!prev) return 0;
    return prev.total - prev.paid_amount; // signed: +debt, -credit
  }

  private async cascadeCarryForward(
    roomId: Types.ObjectId,
    month: number,
    year: number,
    newCF: number,
  ): Promise<void> {
    const record = await this.rentModel.findOne({ room_id: roomId, month, year });
    if (!record) return; // no record — lazy pick-up on creation
    if (record.carry_forward === newCF) return; // no change — stop cascade

    const newTotal = Math.max(
      0,
      record.base_rent + record.electricity + newCF,
    );
    let newStatus: string;
    if (record.paid_amount >= newTotal) newStatus = 'PAID';
    else if (record.paid_amount > 0) newStatus = 'PARTIAL';
    else newStatus = 'PENDING';

    await this.rentModel.updateOne(
      { _id: record._id },
      {
        $set: {
          carry_forward: newCF,
          total: newTotal,
          status: newStatus,
          updated_at: new Date(),
        },
      },
    );

    // Recurse: next month's carry = what's still owed on this month
    const nextRemaining = newTotal - record.paid_amount;
    const [nextM, nextY] = this.nextMonthYear(month, year);
    await this.cascadeCarryForward(roomId, nextM, nextY, nextRemaining);
  }

  // ────────────────────────────────────────────────────────────
  // Public API — Landlord
  // ────────────────────────────────────────────────────────────

  async getMonthlyForProperty(
    propertyId: string,
    month: number,
    year: number,
  ) {
    const propId = new Types.ObjectId(propertyId);
    const rooms = await this.roomModel.find({ property_id: propId });

    const now = new Date();
    const nowMonth = now.getMonth() + 1;
    const nowYear = now.getFullYear();
    const isPastMonth =
      year < nowYear || (year === nowYear && month < nowMonth);

    return Promise.all(
      rooms.map(async (room) => {
        let record = await this.rentModel.findOne({
          room_id: room._id,
          month,
          year,
        });

        // Auto-create PENDING stub only for current/future months
        if (!record && !isPastMonth) {
          const cf = await this.computeCarryForward(
            room._id as Types.ObjectId,
            month,
            year,
          );
          const total = Math.max(0, room.base_rent + cf);
          record = await this.rentModel.create({
            room_id: room._id,
            property_id: propId,
            month,
            year,
            base_rent: room.base_rent,
            electricity: 0,
            carry_forward: cf,
            total,
            status: 'PENDING',
          });
        }

        // Resolve active assignment → tenant name
        const assignment = await this.assignmentModel.findOne({
          room_id: room._id,
          is_active: true,
        });
        let tenant_name: string | undefined;

        if (assignment) {
          // Attach tenant_id to stub if missing
          if (record && !record.tenant_id) {
            await this.rentModel.updateOne(
              { _id: record._id },
              { $set: { tenant_id: assignment.tenant_id } },
            );
            record.tenant_id = assignment.tenant_id;
          }
          const tenant = await this.userModel.findById(assignment.tenant_id);
          tenant_name = tenant?.name;
        }

        const roomObj = room.toObject() as any;
        roomObj.id = room._id.toString();
        roomObj.is_occupied = !!assignment;

        return {
          room: roomObj,
          rent_record: record,
          tenant_name,
        };
      }),
    );
  }

  async getRoomHistory(roomId: string) {
    return this.rentModel
      .find({ room_id: new Types.ObjectId(roomId) })
      .sort({ year: -1, month: -1 });
  }

  async saveRecord(dto: SaveRecordDto) {
    const roomId = new Types.ObjectId(dto.room_id);
    const propertyId = new Types.ObjectId(dto.property_id);
    const electricity = dto.electricity ?? 0;
    const notes = dto.notes ?? '';

    const existing = await this.rentModel.findOne({
      room_id: roomId,
      month: dto.month,
      year: dto.year,
    });

    if (existing) {
      // Update existing — preserve carry_forward
      const total = Math.max(
        0,
        dto.base_rent + electricity + existing.carry_forward,
      );
      let status: string;
      if (existing.paid_amount >= total) status = 'PAID';
      else if (existing.paid_amount > 0) status = 'PARTIAL';
      else status = 'PENDING';

      await this.rentModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            base_rent: dto.base_rent,
            electricity,
            total,
            notes,
            status,
            updated_at: new Date(),
          },
        },
      );
      return this.rentModel.findById(existing._id);
    }

    // New record
    const cf = await this.computeCarryForward(roomId, dto.month, dto.year);
    const total = Math.max(0, dto.base_rent + electricity + cf);

    const assignment = await this.assignmentModel.findOne({
      room_id: roomId,
      is_active: true,
    });

    return this.rentModel.create({
      room_id: roomId,
      property_id: propertyId,
      month: dto.month,
      year: dto.year,
      base_rent: dto.base_rent,
      electricity,
      carry_forward: cf,
      total,
      notes,
      status: 'PENDING',
      tenant_id: assignment?.tenant_id ?? null,
    });
  }

  async recordPayment(
    id: string,
    amount: number | undefined,
    paidDate: Date,
    byUserId: string,
    byEmail: string,
  ) {
    const record = await this.rentModel.findById(id);
    if (!record) throw new NotFoundException('Rent record not found');

    // If no amount given → fully paid
    const payAmount = amount !== undefined ? amount : record.total;
    const prevAmount = record.paid_amount;

    let status: string;
    if (payAmount >= record.total) status = 'PAID';
    else if (payAmount > 0) status = 'PARTIAL';
    else status = 'PENDING';

    const entry: any = {
      action: prevAmount > 0 ? 'PAYMENT_UPDATED' : 'PAYMENT_RECORDED',
      amount: payAmount,
      by_user_id: byUserId,
      by_email: byEmail,
      at: new Date(),
    };
    if (prevAmount > 0) entry.prev_amount = prevAmount;

    await this.rentModel.updateOne(
      { _id: record._id },
      {
        $set: {
          paid_amount: payAmount,
          status,
          paid_date: paidDate,
          updated_at: new Date(),
        },
        $push: { payment_history: entry },
      },
    );

    // Cascade remaining balance (signed) to next month
    const remaining = record.total - payAmount;
    const [nextM, nextY] = this.nextMonthYear(record.month, record.year);
    await this.cascadeCarryForward(
      record.room_id as Types.ObjectId,
      nextM,
      nextY,
      remaining,
    );

    return this.rentModel.findById(id);
  }

  // ────────────────────────────────────────────────────────────
  // Public API — Tenant
  // ────────────────────────────────────────────────────────────

  async getMyRent(tenantId: string, month: number, year: number) {
    return this.rentModel.find({
      tenant_id: new Types.ObjectId(tenantId),
      month,
      year,
    });
  }

  async getMyHistory(tenantId: string) {
    return this.rentModel
      .find({ tenant_id: new Types.ObjectId(tenantId) })
      .sort({ year: -1, month: -1 });
  }
}
