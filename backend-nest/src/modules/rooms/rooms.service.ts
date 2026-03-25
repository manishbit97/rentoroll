import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument } from '@database/schemas/room.schema';
import {
  Property,
  PropertyDocument,
} from '@database/schemas/property.schema';
import {
  TenantAssignment,
  TenantAssignmentDocument,
} from '@database/schemas/tenant-assignment.schema';
import { User, UserDocument } from '@database/schemas/user.schema';
import {
  RentRecord,
  RentRecordDocument,
} from '@database/schemas/rent-record.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { AssignTenantDto } from './dto/assign-tenant.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(TenantAssignment.name)
    private readonly assignmentModel: Model<TenantAssignmentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RentRecord.name)
    private readonly rentModel: Model<RentRecordDocument>,
  ) {}

  private isLandlordOfProperty(property: PropertyDocument, landlordId: string): boolean {
    const isPrimary = property.landlord_id.toString() === landlordId;
    const isCoLandlord = property.co_landlord_ids?.some(
      (id) => id.toString() === landlordId,
    );
    return isPrimary || isCoLandlord;
  }

  async listByProperty(propertyId: string, landlordId: string) {
    const property = await this.propertyModel.findById(propertyId);
    if (!property) throw new NotFoundException('Property not found');
    if (!this.isLandlordOfProperty(property, landlordId)) {
      throw new ForbiddenException('Access denied');
    }

    const rooms = await this.roomModel.find({
      property_id: new Types.ObjectId(propertyId),
    });

    return Promise.all(
      rooms.map(async (room) => {
        const assignment = await this.assignmentModel.findOne({
          room_id: room._id,
          is_active: true,
        });
        let tenant_name: string | null = null;
        if (assignment) {
          const tenant = await this.userModel.findById(assignment.tenant_id);
          tenant_name = tenant?.name ?? null;
        }
        return {
          ...room.toObject(),
          id: room._id.toString(),
          is_occupied: !!assignment,
          tenant_name,
        };
      }),
    );
  }

  async create(propertyId: string, landlordId: string, dto: CreateRoomDto) {
    const property = await this.propertyModel.findById(propertyId);
    if (!property) throw new NotFoundException('Property not found');
    if (!this.isLandlordOfProperty(property, landlordId)) {
      throw new ForbiddenException('Access denied');
    }
    return this.roomModel.create({
      property_id: new Types.ObjectId(propertyId),
      name: dto.name,
      base_rent: dto.base_rent,
    });
  }

  async update(id: string, dto: CreateRoomDto) {
    const room = await this.roomModel.findById(id);
    if (!room) throw new NotFoundException('Room not found');
    return this.roomModel.findByIdAndUpdate(
      id,
      { $set: { name: dto.name, base_rent: dto.base_rent } },
      { new: true },
    );
  }

  async delete(id: string) {
    const room = await this.roomModel.findById(id);
    if (!room) throw new NotFoundException('Room not found');
    await this.roomModel.findByIdAndDelete(id);
    return null;
  }

  async assignTenant(roomId: string, dto: AssignTenantDto) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    // Deactivate any existing active assignment
    await this.assignmentModel.updateMany(
      { room_id: new Types.ObjectId(roomId), is_active: true },
      { $set: { is_active: false, end_date: new Date() } },
    );

    const tenantId = new Types.ObjectId(dto.tenant_id);

    const assignment = await this.assignmentModel.create({
      room_id: new Types.ObjectId(roomId),
      tenant_id: tenantId,
      start_date: new Date(),
      is_active: true,
    });

    // Backfill tenant_id on any rent record stubs that were auto-created
    // before this tenant was assigned (they would have tenant_id = null)
    await this.rentModel.updateMany(
      { room_id: new Types.ObjectId(roomId), tenant_id: null },
      { $set: { tenant_id: tenantId } },
    );

    return assignment;
  }

  async removeTenant(roomId: string) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    await this.assignmentModel.updateMany(
      { room_id: new Types.ObjectId(roomId), is_active: true },
      { $set: { is_active: false, end_date: new Date() } },
    );
    return null;
  }

  async updateAdvance(roomId: string, amount: number) {
    const assignment = await this.assignmentModel.findOne({
      room_id: new Types.ObjectId(roomId),
      is_active: true,
    });
    if (!assignment) throw new NotFoundException('No active tenant in this room');
    if (assignment.advance_adjusted) {
      throw new BadRequestException('Advance has already been applied to a rent record');
    }
    assignment.advance_amount = amount;
    await assignment.save();
    return assignment;
  }

  async setVacatingDate(roomId: string, vacatingDate: Date) {
    const assignment = await this.assignmentModel.findOne({
      room_id: new Types.ObjectId(roomId),
      is_active: true,
    });
    if (!assignment) throw new NotFoundException('No active tenant in this room');
    if (vacatingDate <= new Date()) {
      throw new BadRequestException('Vacating date must be in the future');
    }
    assignment.vacating_date = vacatingDate;
    assignment.vacating_set_by = 'landlord';
    await assignment.save();
    return assignment;
  }

  async clearVacatingDate(roomId: string) {
    const assignment = await this.assignmentModel.findOne({
      room_id: new Types.ObjectId(roomId),
      is_active: true,
    });
    if (!assignment) throw new NotFoundException('No active tenant in this room');
    assignment.vacating_date = null;
    assignment.vacating_set_by = null;
    await assignment.save();
    return assignment;
  }

  async getTenantsForLandlord(landlordId: string) {
    const id = new Types.ObjectId(landlordId);

    // 1. All properties this landlord owns or co-manages
    const properties = await this.propertyModel.find({
      $or: [{ landlord_id: id }, { co_landlord_ids: id }],
    });

    if (properties.length === 0) return [];

    // 2. All rooms across those properties
    const propertyIds = properties.map((p) => p._id);
    const rooms = await this.roomModel.find({
      property_id: { $in: propertyIds },
    });

    if (rooms.length === 0) return [];

    // 3. Active assignments for those rooms
    const roomIds = rooms.map((r) => r._id);
    const assignments = await this.assignmentModel.find({
      room_id: { $in: roomIds },
      is_active: true,
    });

    if (assignments.length === 0) return [];

    // 4. Tenant user details
    const tenantIds = assignments.map((a) => a.tenant_id);
    const tenants = await this.userModel.find({ _id: { $in: tenantIds } });

    // 5. Join and return flat list
    return assignments.map((a) => {
      const room = rooms.find((r) => r._id.equals(a.room_id));
      const property = properties.find((p) =>
        p._id.equals(room?.property_id),
      );
      const tenant = tenants.find((t) => t._id.equals(a.tenant_id));
      return {
        property_id: property?._id.toString(),
        property_name: property?.name ?? '',
        room_id: room?._id.toString(),
        room_name: room?.name ?? '',
        base_rent: room?.base_rent ?? 0,
        tenant_id: tenant?._id.toString(),
        tenant_name: tenant?.name ?? '',
        tenant_email: tenant?.email ?? '',
      };
    });
  }
}
