import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Property,
  PropertyDocument,
} from '@database/schemas/property.schema';
import { User, UserDocument } from '@database/schemas/user.schema';
import { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async list(landlordId: string) {
    const id = new Types.ObjectId(landlordId);
    return this.propertyModel
      .find({ $or: [{ landlord_id: id }, { co_landlord_ids: id }] })
      .sort({ created_at: -1 });
  }

  async create(landlordId: string, dto: CreatePropertyDto) {
    return this.propertyModel.create({
      landlord_id: new Types.ObjectId(landlordId),
      name: dto.name,
      address: dto.address ?? '',
    });
  }

  async getById(id: string, landlordId: string) {
    const property = await this.propertyModel.findById(id);
    if (!property) throw new NotFoundException('Property not found');
    this.assertOwner(property, landlordId);
    return property;
  }

  async update(id: string, landlordId: string, dto: CreatePropertyDto) {
    const property = await this.propertyModel.findById(id);
    if (!property) throw new NotFoundException('Property not found');
    this.assertOwner(property, landlordId);
    return this.propertyModel.findByIdAndUpdate(
      id,
      { $set: { name: dto.name, address: dto.address ?? property.address } },
      { new: true },
    );
  }

  async delete(id: string, landlordId: string) {
    const property = await this.propertyModel.findById(id);
    if (!property) throw new NotFoundException('Property not found');
    this.assertOwner(property, landlordId);
    await this.propertyModel.findByIdAndDelete(id);
    return null;
  }

  async getCoLandlords(propertyId: string, landlordId: string) {
    const property = await this.propertyModel.findById(propertyId);
    if (!property) throw new NotFoundException('Property not found');
    this.assertOwner(property, landlordId);
    const ids = property.co_landlord_ids ?? [];
    if (ids.length === 0) return [];
    const users = await this.userModel.find({ _id: { $in: ids } });
    return users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email }));
  }

  async addCoLandlord(propertyId: string, landlordId: string, email: string) {
    const property = await this.propertyModel.findById(propertyId);
    if (!property) throw new NotFoundException('Property not found');
    // Only primary owner can manage co-landlords
    if (property.landlord_id.toString() !== landlordId) {
      throw new ForbiddenException('Only the primary owner can manage co-landlords');
    }
    const target = await this.userModel.findOne({ email, role: 'landlord' });
    if (!target) throw new NotFoundException('Landlord not found with that email');
    if (target._id.equals(property.landlord_id)) {
      throw new BadRequestException('This user is already the primary owner');
    }
    const alreadyAdded = property.co_landlord_ids?.some((id) => id.equals(target._id));
    if (alreadyAdded) throw new BadRequestException('This landlord is already a co-manager');
    await this.propertyModel.updateOne(
      { _id: property._id },
      { $push: { co_landlord_ids: target._id } },
    );
    return { id: target._id.toString(), name: target.name, email: target.email };
  }

  async removeCoLandlord(propertyId: string, landlordId: string, targetUserId: string) {
    const property = await this.propertyModel.findById(propertyId);
    if (!property) throw new NotFoundException('Property not found');
    if (property.landlord_id.toString() !== landlordId) {
      throw new ForbiddenException('Only the primary owner can manage co-landlords');
    }
    await this.propertyModel.updateOne(
      { _id: property._id },
      { $pull: { co_landlord_ids: new Types.ObjectId(targetUserId) } },
    );
    return null;
  }

  private assertOwner(property: PropertyDocument, landlordId: string) {
    const isPrimary = property.landlord_id.toString() === landlordId;
    const isCoLandlord = property.co_landlord_ids?.some(
      (id) => id.toString() === landlordId,
    );
    if (!isPrimary && !isCoLandlord) {
      throw new ForbiddenException('Access denied');
    }
  }
}
