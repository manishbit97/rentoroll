import {
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
  ) {}

  async listByProperty(propertyId: string, landlordId: string) {
    const property = await this.propertyModel.findById(propertyId);
    if (!property) throw new NotFoundException('Property not found');
    if (property.landlord_id.toString() !== landlordId) {
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
    if (property.landlord_id.toString() !== landlordId) {
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

    const assignment = await this.assignmentModel.create({
      room_id: new Types.ObjectId(roomId),
      tenant_id: new Types.ObjectId(dto.tenant_id),
      start_date: new Date(),
      is_active: true,
    });
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
}
