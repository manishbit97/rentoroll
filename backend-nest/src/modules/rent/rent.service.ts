import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { Property, PropertyDocument } from '@database/schemas/property.schema';
import { MailService } from '../mail/mail.service';
import { SaveRecordDto } from './dto/save-record.dto';
import { RentIncreaseDto } from './dto/rent-increase.dto';

@Injectable()
export class RentService {
  constructor(
    @InjectModel(RentRecord.name)
    private readonly rentModel: Model<RentRecordDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(TenantAssignment.name)
    private readonly assignmentModel: Model<TenantAssignmentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    private readonly mailService: MailService,
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
        let tenant_email: string | undefined;

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
          tenant_email = tenant?.email;
        }

        const roomObj = room.toObject() as any;
        roomObj.id = room._id.toString();
        roomObj.is_occupied = !!assignment;

        return {
          room: roomObj,
          rent_record: record,
          tenant_name,
          tenant_email,
          advance_amount: assignment?.advance_amount ?? 0,
          advance_adjusted: assignment?.advance_adjusted ?? false,
          vacating_date: assignment?.vacating_date ?? null,
          vacating_set_by: assignment?.vacating_set_by ?? null,
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

  // Enrich rent records with room name, property name, landlord UPI
  private async enrichRecords(records: RentRecordDocument[]) {
    if (!records.length) return [];

    const roomIds = [...new Set(records.map((r) => r.room_id.toString()))];
    const propIds = [...new Set(records.map((r) => r.property_id.toString()))];

    const [rooms, properties, assignments] = await Promise.all([
      this.roomModel.find({ _id: { $in: roomIds } }).lean(),
      this.propertyModel.find({ _id: { $in: propIds } }).lean(),
      this.assignmentModel.find({ room_id: { $in: roomIds }, is_active: true }).lean(),
    ]);

    const landlordIds = [...new Set(properties.map((p) => p.landlord_id.toString()))];
    const landlords = await this.userModel
      .find({ _id: { $in: landlordIds } })
      .select('name upi_id')
      .lean();

    const roomMap = Object.fromEntries(rooms.map((r) => [r._id.toString(), r]));
    const propMap = Object.fromEntries(properties.map((p) => [p._id.toString(), p]));
    const landlordMap = Object.fromEntries(landlords.map((u) => [u._id.toString(), u]));
    const assignmentByRoom = Object.fromEntries(
      assignments.map((a) => [a.room_id.toString(), a]),
    );

    return records.map((rec) => {
      const obj = rec.toObject();
      const room = roomMap[rec.room_id.toString()];
      const prop = propMap[rec.property_id.toString()];
      const landlord = prop ? landlordMap[prop.landlord_id.toString()] : null;
      const assignment = assignmentByRoom[rec.room_id.toString()];
      return {
        ...obj,
        room_name: room?.name ?? '',
        property_name: prop?.name ?? '',
        landlord_upi: landlord?.upi_id ?? '',
        landlord_name: landlord?.name ?? '',
        advance_amount: assignment?.advance_amount ?? 0,
        advance_adjusted: assignment?.advance_adjusted ?? false,
        vacating_date: assignment?.vacating_date ?? null,
      };
    });
  }

  async getMyRent(tenantId: string, month: number, year: number) {
    const records = await this.rentModel.find({
      tenant_id: new Types.ObjectId(tenantId),
      month,
      year,
    });
    return this.enrichRecords(records);
  }

  async getMyHistory(tenantId: string) {
    const records = await this.rentModel
      .find({ tenant_id: new Types.ObjectId(tenantId) })
      .sort({ year: -1, month: -1 });
    return this.enrichRecords(records);
  }

  async applyAdvance(rentRecordId: string, byUserId: string, byEmail: string) {
    const record = await this.rentModel.findById(rentRecordId);
    if (!record) throw new NotFoundException('Rent record not found');

    const assignment = await this.assignmentModel.findOne({
      room_id: record.room_id,
      is_active: true,
    });
    if (!assignment) throw new NotFoundException('No active tenant found for this room');
    if (assignment.advance_adjusted) throw new BadRequestException('Advance has already been applied');
    if (assignment.advance_amount <= 0) throw new BadRequestException('No advance amount on record');
    if (record.status === 'PAID') throw new BadRequestException('This record is already fully paid');

    const remaining = record.total - record.paid_amount;
    const payAmt = Math.min(assignment.advance_amount, remaining);
    const refund = Math.max(0, assignment.advance_amount - remaining);
    const shortfall = Math.max(0, remaining - assignment.advance_amount);

    const prevPaidAmount = record.paid_amount;
    const newPaidAmount = prevPaidAmount + payAmt;

    let newStatus: string;
    if (newPaidAmount >= record.total) newStatus = 'PAID';
    else if (newPaidAmount > 0) newStatus = 'PARTIAL';
    else newStatus = 'PENDING';

    let note = '';
    if (refund > 0) note = `Refund ₹${refund} due to tenant`;
    else if (shortfall > 0) note = `₹${shortfall} still owed`;

    await this.rentModel.updateOne(
      { _id: record._id },
      {
        $set: { paid_amount: newPaidAmount, status: newStatus, updated_at: new Date() },
        $push: {
          payment_history: {
            action: 'ADVANCE_APPLIED',
            amount: newPaidAmount,
            prev_amount: prevPaidAmount,
            by_user_id: byUserId,
            by_email: byEmail,
            at: new Date(),
            note,
          },
        },
      },
    );

    const newRemaining = record.total - newPaidAmount;
    const [nextM, nextY] = this.nextMonthYear(record.month, record.year);
    await this.cascadeCarryForward(record.room_id as Types.ObjectId, nextM, nextY, newRemaining);

    assignment.advance_adjusted = true;
    assignment.advance_amount = 0;
    await assignment.save();

    return {
      rent_record: await this.rentModel.findById(rentRecordId),
      payment_applied: payAmt,
      refund,
      shortfall,
    };
  }

  async applyRentIncrease(roomId: string, dto: RentIncreaseDto, byUserId: string, byEmail: string) {
    const roomObjId = new Types.ObjectId(roomId);
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    const records = await this.rentModel
      .find({
        room_id: roomObjId,
        status: { $ne: 'PAID' },
        $or: [
          { year: { $gt: dto.from_year } },
          { year: dto.from_year, month: { $gte: dto.from_month } },
        ],
      })
      .sort({ year: 1, month: 1 })
      .lean();

    if (records.length > 0) {
      // Update base_rent on all affected records
      const recordIds = records.map((r) => r._id);
      await this.rentModel.updateMany(
        { _id: { $in: recordIds } },
        { $set: { base_rent: dto.new_base_rent } },
      );

      // Recompute first record's total/status with new base_rent
      const first = records[0];
      const newFirstTotal = Math.max(0, dto.new_base_rent + first.electricity + first.carry_forward);
      let newFirstStatus: string;
      if (first.paid_amount >= newFirstTotal) newFirstStatus = 'PAID';
      else if (first.paid_amount > 0) newFirstStatus = 'PARTIAL';
      else newFirstStatus = 'PENDING';

      await this.rentModel.updateOne(
        { _id: first._id },
        { $set: { total: newFirstTotal, status: newFirstStatus } },
      );

      // Cascade carry-forward starting from month after the first updated record
      const firstRemaining = newFirstTotal - first.paid_amount;
      const [nextM, nextY] = this.nextMonthYear(first.month, first.year);
      await this.cascadeCarryForward(roomObjId, nextM, nextY, firstRemaining);
    }

    await this.roomModel.updateOne(
      { _id: room._id },
      {
        $set: {
          base_rent: dto.new_base_rent,
          base_rent_effective_from: new Date(dto.from_year, dto.from_month - 1, 1),
        },
      },
    );

    return {
      updated_count: records.length,
      room: await this.roomModel.findById(roomId),
    };
  }

  async setMyVacatingDate(tenantId: string, vacatingDate: Date) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const assignment = await this.assignmentModel.findOne({
      tenant_id: tenantObjId,
      is_active: true,
    });
    if (!assignment) throw new NotFoundException('No active assignment found');
    if (vacatingDate <= new Date()) {
      throw new BadRequestException('Vacating date must be in the future');
    }

    assignment.vacating_date = vacatingDate;
    assignment.vacating_set_by = 'tenant';
    await assignment.save();

    // Fire-and-forget email to landlord
    (async () => {
      try {
        const [room, tenant] = await Promise.all([
          this.roomModel.findById(assignment.room_id),
          this.userModel.findById(assignment.tenant_id),
        ]);
        if (!room) return;
        const property = await this.propertyModel.findById(room.property_id);
        if (!property) return;
        const landlord = await this.userModel.findById(property.landlord_id);
        if (landlord?.email) {
          await this.mailService.sendNoticeMail(
            landlord.email,
            tenant?.name ?? 'Tenant',
            room.name,
            property.name,
            vacatingDate,
          );
        }
      } catch {}
    })();

    return assignment;
  }

  async clearMyVacatingDate(tenantId: string) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const assignment = await this.assignmentModel.findOne({
      tenant_id: tenantObjId,
      is_active: true,
    });
    if (!assignment) throw new NotFoundException('No active assignment found');
    assignment.vacating_date = null;
    assignment.vacating_set_by = null;
    await assignment.save();
    return assignment;
  }
}
