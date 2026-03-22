import {
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
import { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  async list(landlordId: string) {
    const id = new Types.ObjectId(landlordId);
    return this.propertyModel.find({ landlord_id: id }).sort({ created_at: -1 });
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

  private assertOwner(property: PropertyDocument, landlordId: string) {
    if (property.landlord_id.toString() !== landlordId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
